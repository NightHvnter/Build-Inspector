import ICpu from "./ICpu";
import IGpu from "./IGpu";
import IRam from "./IRam";


interface Build {
    GetCpu: () => ICpu
    GetGpu: () => IGpu
    GetRam: () => IRam
}



declare const Build: Build

export default Build;