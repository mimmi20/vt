interface PensionInfo {
    summary: number;
    bubbles: boolean;
    cancelable: boolean;
}

interface GlobalEventHandlersEventMap {
    'pension.added': CustomEvent<PensionInfo>;
}

interface TestInfo {
    stkl: number;
    re4: number;
    lzz: number;
    krv: number;
    pvz: number;
    r: number;
    kvz: number;
    zkf: number;
    pkv: number;
    pvs: number;
    af: number;
    bk: number;
    bks: number;
    bkv: number;
    lstlzz: number;
    solzlzz: number;
    solzs: number;
    solzv: number;
    sts: number;
    stv: number;
    vkvlzz: number;
    vkvsonst: number;
    vfrb: number;
    vfrbs1: number;
    vfrbs2: number;
    wvfrb: number;
    wvfrbo: number;
    wvfrbm: number;
}
