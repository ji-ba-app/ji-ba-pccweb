export enum ComponentType {
  Case = 'case',
  Motherboard = 'motherboard',
  CPU = 'cpu',
  PCIe = 'pcie',
  RAM = 'ram',
  Storage = 'storage',
  PowerSupply = 'powersupply',
  Fan = 'fan',
  Cooler = 'cooler',
}

/**
 * Motherboard size enum
 */
export enum MotherBoardSize {
  /**
   * SSI CEB size (305mm x 267mm)
   */
  SSICEB = 'SSICEB',

  /**
   * SSI EEB size (305mm x 330mm)
   *
   * SSI EEB and ExtendedATX are the same size
   */
  SSIEEB = 'SSIEEB',

  /**
   * Extended ATX size (305mm x 330mm)
   *
   * SSI_EEB and ExtendedATX are the same size
   */
  ExtendedATX = 'ExtendedATX',

  /**
   * ATX size (305mm x 244mm)
   */
  ATX = 'ATX',

  /**
   * Micro ATX size (244mm x 244mm)
   */
  MicroATX = 'MicroATX',

  /**
   * Flex ATX size (229mm x 191mm)
   */
  FlexATX = 'FlexATX',

  /**
   * ITX size (215mm x 191mm)
   */
  ITX = 'ITX',

  /**
   * MiniDTX size (203mm x 170mm)
   */
  MiniDTX = 'MiniDTX',

  /**
   * Mini ITX size (170mm x 170mm)
   */
  MiniITX = 'MiniITX',

  /**
   * Unknown size
   */
  Unknown = 'Unknown',
}

const MotherBoardSizeOrder = [
  MotherBoardSize.SSICEB,
  MotherBoardSize.SSIEEB,
  MotherBoardSize.ExtendedATX,
  MotherBoardSize.ATX,
  MotherBoardSize.MicroATX,
  MotherBoardSize.FlexATX,
  MotherBoardSize.ITX,
  MotherBoardSize.MiniDTX,
  MotherBoardSize.MiniITX,
];

/**
 * Compare two motherboard size
 * @param a mother board size
 * @param b mother board size
 * @returns -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareMotherBoardSize(a: MotherBoardSize, b: MotherBoardSize) {
  return MotherBoardSizeOrder.indexOf(a) - MotherBoardSizeOrder.indexOf(b);
}

/**
 * Power supply size enum
 */
export enum PowerSize {
  /**
   * ATX size (150mm x 85mm)
   */
  ATX = 'ATX',

  /**
   * SFX size (125mm x 65mm)
   */
  SFX = 'SFX',

  /**
   * TFX size (85mm x 65mm)
   */
  TFX = 'TFX',

  /**
   * Unknown size
   */
  Unknown = 'Unknown',
}

const PowerSizeOrder = [PowerSize.ATX, PowerSize.SFX, PowerSize.TFX];

/**
 * Compare two power supply size
 * @param a power supply size
 * @param b power supply size
 * @returns -1 if a < b, 0 if a == b, 1 if a > b
 */
export function comparePowerSize(a: PowerSize, b: PowerSize) {
  return PowerSizeOrder.indexOf(a) - PowerSizeOrder.indexOf(b);
}

export enum StorageType {
  HDD = 'HDD',
  SATASSD = 'SATASSD',
  M2SSD = 'M2SSD',
  NVMESSD = 'NVMESSD',
  Unknown = 'Unknown',
}

const StorageTypes = [
  StorageType.HDD,
  StorageType.SATASSD,
  StorageType.M2SSD,
  StorageType.NVMESSD,
];

export enum CpuSocket {
  LGA1700 = 'LGA1700',
  LGA1200 = 'LGA1200',
  LGA1151V2 = 'LGA1151V2',
  LGA1151 = 'LGA1151',

  AM5 = 'AM5',
  AM4 = 'AM4',
}

const CpuSockets = [
  CpuSocket.LGA1700,
  CpuSocket.LGA1200,
  CpuSocket.LGA1151V2,
  CpuSocket.LGA1151,
  CpuSocket.AM5,
  CpuSocket.AM4,
];

export enum RamType {
  DDR3 = 'DDR3',
  DDR4 = 'DDR4',
  DDR5 = 'DDR5',
  Unknown = 'Unknown',
}

const RamTypes = [RamType.DDR3, RamType.DDR4, RamType.DDR5];

export enum PCIeType {
  PCIe1 = 'x1',
  PCIe4 = 'x4',
  PCIe8 = 'x8',
  PCIe16 = 'x16',
  Unknown = 'Unknown',
}

const PCIeTypes = [
  PCIeType.PCIe1,
  PCIeType.PCIe4,
  PCIeType.PCIe8,
  PCIeType.PCIe16,
  PCIeType.Unknown,
];

export function comparePCIeType(a: PCIeType, b: PCIeType) {
  return PCIeTypes.indexOf(a) - PCIeTypes.indexOf(b);
}

export type CompatibilityConstructor<T> = new (
  protocol?: T,
) => Compatibility<T>;

export abstract class Compatibility<T = any> {
  public static componentTypeToConstructor = new Map<
    ComponentType,
    CompatibilityConstructor<any>
  >();

  public readonly type: ComponentType;
  public readonly protocol: T;

  public constructor(type: ComponentType, protocol: T) {
    this.type = type;
    this.protocol = protocol;
  }

  public clone(): Compatibility<T> {
    return new (this.constructor as CompatibilityConstructor<T>)(this.protocol);
  }

  public abstract isCompatibleWith<U>(component: Compatibility<U>): boolean;

  public static parseFromCompatString(
    compatString: string,
  ): Compatibility<any> | undefined {
    const [type, ...protocol] = compatString.split(',');
    const ctor = Compatibility.componentTypeToConstructor.get(
      type as ComponentType,
    );
    if (ctor) {
      if (protocol.length === 1) {
        return new ctor(protocol[0]);
      } else {
        return new ctor(protocol);
      }
    }
    return undefined;
  }
}

export class CaseCompatibility extends Compatibility<void> {
  static {
    Compatibility.componentTypeToConstructor.set(
      ComponentType.Case,
      CaseCompatibility,
    );
  }

  public constructor() {
    super(ComponentType.Case, undefined);
  }

  public isCompatibleWith<U>(component: Compatibility<U>): boolean {
    return component instanceof CaseCompatibility;
  }
}

export class MotherBoardCompatibility extends Compatibility<MotherBoardSize> {
  static {
    Compatibility.componentTypeToConstructor.set(
      ComponentType.Motherboard,
      MotherBoardCompatibility,
    );
  }

  public constructor(size: MotherBoardSize) {
    if (MotherBoardSizeOrder.indexOf(size) === -1) {
      size = MotherBoardSize.Unknown;
    }

    super(ComponentType.Motherboard, size);
  }

  public isCompatibleWith<U>(component: Compatibility<U>): boolean {
    if (component instanceof MotherBoardCompatibility) {
      return compareMotherBoardSize(this.protocol, component.protocol) >= 0;
    }
    return false;
  }
}

export class PowerSupplyCompatibility extends Compatibility<PowerSize> {
  static {
    Compatibility.componentTypeToConstructor.set(
      ComponentType.PowerSupply,
      PowerSupplyCompatibility,
    );
  }

  public constructor(size: PowerSize) {
    if (PowerSizeOrder.indexOf(size) === -1) {
      size = PowerSize.Unknown;
    }

    super(ComponentType.PowerSupply, size);
  }

  public isCompatibleWith<U>(component: Compatibility<U>): boolean {
    if (component instanceof PowerSupplyCompatibility) {
      return comparePowerSize(this.protocol, component.protocol) >= 0;
    }
    return false;
  }
}

export class StorageCompatibility extends Compatibility<StorageType> {
  static {
    Compatibility.componentTypeToConstructor.set(
      ComponentType.Storage,
      StorageCompatibility,
    );
  }

  public constructor(type: StorageType) {
    if (StorageTypes.indexOf(type) === -1) {
      type = StorageType.Unknown;
    }

    super(ComponentType.Storage, type);
  }

  public isCompatibleWith<U>(component: Compatibility<U>): boolean {
    if (component instanceof StorageCompatibility) {
      return this.protocol === component.protocol;
    }
    return false;
  }
}

export class FanCompatibility extends Compatibility<number> {
  static {
    Compatibility.componentTypeToConstructor.set(
      ComponentType.Fan,
      FanCompatibility,
    );
  }

  public constructor(size: number) {
    super(ComponentType.Fan, size);
  }

  public isCompatibleWith<U>(component: Compatibility<U>): boolean {
    if (component instanceof FanCompatibility) {
      return this.protocol === component.protocol;
    }
    return false;
  }
}

export class CpuCompatibility extends Compatibility<CpuSocket> {
  static {
    Compatibility.componentTypeToConstructor.set(
      ComponentType.CPU,
      CpuCompatibility,
    );
  }

  public constructor(socket: CpuSocket) {
    super(ComponentType.CPU, socket);
  }

  public isCompatibleWith<U>(component: Compatibility<U>): boolean {
    if (component instanceof CpuCompatibility) {
      if (CpuSockets.indexOf(this.protocol) === -1) {
        console.error('Unknown CPU socket:', this.protocol);
        return false;
      }
      return this.protocol === component.protocol;
    }
    return false;
  }
}

export class RamCompatibility extends Compatibility<RamType> {
  static {
    Compatibility.componentTypeToConstructor.set(
      ComponentType.RAM,
      RamCompatibility,
    );
  }

  public constructor(type: RamType) {
    if (RamTypes.indexOf(type) === -1) {
      type = RamType.Unknown;
    }

    super(ComponentType.RAM, type);
  }

  public isCompatibleWith<U>(component: Compatibility<U>): boolean {
    if (component instanceof RamCompatibility) {
      if (RamTypes.indexOf(this.protocol) === -1) {
        console.error('Unknown RAM type:', this.protocol);
        return false;
      }
      return this.protocol === component.protocol;
    }
    return false;
  }
}

export class CoolerCompatibility extends Compatibility<CpuSocket[]> {
  static {
    Compatibility.componentTypeToConstructor.set(
      ComponentType.Cooler,
      CoolerCompatibility,
    );
  }

  public constructor(sockets: CpuSocket[]) {
    super(ComponentType.Cooler, sockets);
  }

  public isCompatibleWith<U>(component: Compatibility<U>): boolean {
    if (component instanceof CoolerCompatibility) {
      const thisSockets = this.protocol;
      const componentSockets = component.protocol;
      for (const socket of thisSockets) {
        if (componentSockets.indexOf(socket) !== -1) {
          if (CpuSockets.indexOf(socket) === -1) {
            console.error('Unknown CPU socket:', socket);
            return false;
          }
          return true;
        }
      }
    }
    return false;
  }
}

export class PCIeCompatibility extends Compatibility<PCIeType> {
  static {
    Compatibility.componentTypeToConstructor.set(
      ComponentType.PCIe,
      PCIeCompatibility,
    );
  }

  public constructor(type: PCIeType) {
    if (PCIeTypes.indexOf(type) === -1) {
      type = PCIeType.Unknown;
    }

    super(ComponentType.PCIe, type);
  }

  public isCompatibleWith<U>(component: Compatibility<U>): boolean {
    if (component instanceof PCIeCompatibility) {
      return comparePCIeType(this.protocol, component.protocol) >= 0;
    }
    return false;
  }
}
