import FingerprintJS from "@fingerprintjs/fingerprintjs";

const getBrowserADN = async () => {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result;
};

export default getBrowserADN;