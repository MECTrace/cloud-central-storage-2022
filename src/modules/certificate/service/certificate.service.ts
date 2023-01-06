import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { X509Certificate } from 'crypto';
import * as fs from 'fs';
import * as https from 'https';
import { firstValueFrom } from 'rxjs';
import { CERTIFICATE_API, FORCE_UPLOAD_API, ROOT_CA } from 'src/constants';
import { NodeService } from 'src/modules/node/service/node.service';
import { getPrefixDomain } from 'src/util/mappingNode';
import { Repository } from 'typeorm';
import { Node } from '../../node/entity/node.entity';
import { Certificate } from '../entity/certificate.entity';
import { ICertificateRes } from '../interfaces';

const NO_CERT = 'No Certificate';
const EXPIRED_QUERY = '"Certificate"."expiredDay" <= Now()';
export class CertificateService {
  constructor(
    @InjectRepository(Certificate)
    private certificateRepository: Repository<Certificate>,
    private nodeServices: NodeService,
    private httpService: HttpService,
  ) {}

  checkCertificateIssue(certificate: Buffer) {
    const certificateData = new X509Certificate(certificate);
    const expiredDay = certificateData.validTo;
    const certExpiredDay = new Date(expiredDay);
    const currentDate = new Date();
    if (certExpiredDay < currentDate) return 'Certificate Expired';
    return 'None';
  }

  async getAllCertificates(): Promise<ICertificateRes> {
    return this.certificateRepository
      .createQueryBuilder('certificate')
      .innerJoin(Node, 'node', 'certificate.nodeId = node.id')
      .select([
        '"certificate"."id"',
        '"certificate"."nodeId"',
        '"node"."name"',
        '"certificate"."expiredDay"',
        '"certificate"."issuedDate"',
        '"certificate"."isIssued"',
        '"certificate"."createdAt"',
        '"certificate"."updatedAt"',
        '"certificate"."certificateIssue"',
        'status',
      ])
      .orderBy('"node"."name"', 'ASC')
      .execute() as Promise<ICertificateRes>;
  }

  async generateCertificateData(listNode: { id: string; name: string }[]) {
    try {
      await Promise.all([
        listNode.map(async (item: { id: string; name: string }) => {
          const isExist = await this.certificateRepository.findOne({
            nodeId: item.id,
          });
          if (!isExist) {
            await this.certificateRepository
              .createQueryBuilder()
              .insert()
              .into(Certificate)
              .values([
                {
                  nodeId: item.id,
                  expiredDay: new Date(),
                  issuedDate: new Date(),
                  certificateIssue: NO_CERT,
                  isIssued: false,
                },
              ])
              .execute();
          }
        }),
      ]);
      return { status: 'succeeded' };
    } catch (err) {
      console.log(err);
      return { status: 'failed' };
    }
  }

  async insertCertificateData(certificate: Buffer) {
    try {
      const certificateData = new X509Certificate(certificate);
      const expiredDay = certificateData.validTo;
      const issuedDate = certificateData.validFrom;
      const nodeId = process.env.NODE_ID;

      const certExpiredDay = new Date(expiredDay);
      const currentDate = new Date();

      const certificateIssue =
        certExpiredDay < currentDate ? 'Certificate Expired' : 'None';

      const rootCA = new X509Certificate(fs.readFileSync(ROOT_CA));

      const isIssued = certificateData.checkIssued(rootCA);

      const isExist = await this.certificateRepository.findOne({
        nodeId,
      });

      await this.certificateRepository
        .createQueryBuilder()
        .update(Node)
        .set({
          status: 'On',
        })
        .where({
          id: nodeId,
        })
        .execute();

      if (!isExist) {
        await this.certificateRepository
          .createQueryBuilder()
          .insert()
          .into(Certificate)
          .values([
            {
              nodeId,
              expiredDay,
              issuedDate,
              certificateIssue,
              isIssued,
            },
          ])
          .execute();
      } else {
        await this.certificateRepository
          .createQueryBuilder()
          .update(Certificate)
          .set({
            expiredDay,
            issuedDate,
            certificateIssue,
            isIssued,
          })
          .where({
            nodeId,
          })
          .execute();
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getExpiredCertificate() {
    const expiredCertificate = await this.certificateRepository
      .createQueryBuilder()
      .select()
      .where(EXPIRED_QUERY)
      .andWhere('"Certificate"."certificateIssue" != :noCert')
      .setParameter('noCert', NO_CERT)
      .getRawMany();

    return {
      expiredCertificate,
      total: expiredCertificate.length || 0,
    };
  }

  async getServerStatus() {
    const normalServer = await this.certificateRepository
      .createQueryBuilder()
      .select()
      .where('"Certificate"."expiredDay" >= Now()')
      .andWhere('"Certificate"."certificateIssue" = :certStatus')
      .setParameter('certStatus', 'None')
      .getRawMany();

    const notWorkServer = await this.certificateRepository
      .createQueryBuilder('certificate')
      .innerJoin(Node, 'node', 'certificate.nodeId = node.id')
      .select()
      .where('"node"."status" = :nodeStatus')
      .setParameter('nodeStatus', 'Down')
      .getRawMany();

    const total = await this.certificateRepository
      .createQueryBuilder()
      .select()
      .getRawMany();

    return {
      errorServer:
        total.length - (notWorkServer.length + normalServer.length) || 0,
      notWorkServer: notWorkServer.length || 0,
      normalServer: normalServer.length || 0,
    };
  }

  async getIssuedCertificate() {
    const issuedCertificate = await this.certificateRepository
      .createQueryBuilder()
      .select()
      .where('"Certificate"."isIssued" = true')
      .getRawMany();

    return {
      issuedCertificate,
      total: issuedCertificate.length || 0,
    };
  }

  async deleteCertificate(nodeId: string) {
    const getName = await this.nodeServices.getNodeById(nodeId);
    if (fs.existsSync(ROOT_CA)) {
      console.log('getName', getName);
      const prefix = getPrefixDomain(getName[0].name);
      console.log('prefix', prefix);

      let url = process.env.NODE_URL + CERTIFICATE_API;
      if (process.env.NODE_ENV === 'PROD') {
        url = 'https://' + prefix + process.env.DOMAIN + CERTIFICATE_API;
      }
      console.log('url', url);

      const httpsAgent = new https.Agent({
        ca: fs.readFileSync(ROOT_CA).toString(),
      });

      console.log(getName);

      await firstValueFrom(
        this.httpService.delete(url, {
          httpsAgent,
        }),
      );
    }
    return "Don't have Certificate";
  }

  async checkAndUpdateCertificate(nodeId: string) {
    const getName = await this.nodeServices.getNodeById(nodeId);
    const prefix = getPrefixDomain(getName[0].name);
    let url = process.env.NODE_URL + FORCE_UPLOAD_API;
    if (process.env.NODE_ENV === 'PROD') {
      url = 'https://' + prefix + process.env.DOMAIN + FORCE_UPLOAD_API;
    }

    const httpsAgent = new https.Agent({
      ca: fs.readFileSync(ROOT_CA).toString(),
    });

    await firstValueFrom(
      this.httpService.get(url, {
        httpsAgent,
      }),
    );
  }
}
