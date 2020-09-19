import { BondApi } from '../BondApi';
import { BondConfig } from './config';
import { BondPlatform } from '../platform';
import { BondPlatformConfig } from '../interface/config';
import { Version } from './Version';

export class Bond {
  // Helper to sanitize the config object into bond objects
  public static objects(platform: BondPlatform): Bond[] {
    const config = platform.config as BondPlatformConfig;
    const bondData: BondConfig[] = config.bonds;
    const bondObjs = bondData.map(config => {
      return new Bond(platform, config);
    });

    return bondObjs;
  }

  // Helper to update the device ids of a group of bonds
  public static updateDeviceIds(bonds: Bond[]): Promise<void[]> {
    const ps: Array<Promise<void>> = [];
    bonds.forEach(bond => {
      ps.push(bond.updateDeviceIds());
      ps.push(bond.updateBondId());
    });

    return Promise.all(ps);
  }

  public api: BondApi;
  public config: BondConfig;
  public deviceIds: string[] = [];
  public version!: Version;

  constructor(
    private readonly platform: BondPlatform,
    config: BondConfig) {
    this.config = config;
    this.api = new BondApi(platform, config.token, config.ip_address, config.bondId);
  }

  public updateDeviceIds(): Promise<void> {
    return this.api
      .getDeviceIds()
      .then(ids => {
        this.deviceIds = ids;
      })
      .catch(error => {
        this.platform.log.error(`Error getting device ids: ${error}`);
      });
  }

  public updateBondId(): Promise<void> {
    return this.api.getVersion()
      .then(version => {
        this.version = version;
        this.platform.log.debug(`
****** Bond Info *******
 bondId: ${version.bondid}
 FW: ${version.fw_ver}
 API: v${version.api}
 Make: ${version.model}
 Model: ${version.model}\n************************`);
      })
      .catch(error => {
        this.platform.log.error(`Error getting version: ${error}`);
      });
  }

  // ID should be unique across multiple bonds in case device's have the same id across bonds.
  public uniqueDeviceId(deviceId: string): string {
    return `${this.version.bondid}${deviceId}`;
  }
}
