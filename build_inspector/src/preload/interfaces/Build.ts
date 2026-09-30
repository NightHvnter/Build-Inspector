import Cpu from "./Cpu";

interface Build {
    GetCpu: () => Cpu
}

declare const Build: Build

export default Build;