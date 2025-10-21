const fs = require("graceful-fs");
const path = require("path");

// goes through ./models and calls their promise to initialize tables if they do not exist
async function modelsInit() {
    const modelsDir = __dirname;
    const files = fs.readdirSync(modelsDir)
        .filter(file => file.endsWith(".js") && file !== "tablesInit.js"); // ignore this source

    for(const file of files) {
        const modelPath = path.join(modelsDir, file);
        const modelModule = require(modelPath);

        // removing .js extension to call the promise
        const modelName = path.basename(file, ".js");

        const modelInit = modelModule[modelName];

        if(modelInit && typeof modelInit.then === "function") {
            try{
                await modelInit;
            } catch(err) {
                console.error(`${modelName} failed at initialization: `, err);
            }
        } else {
            console.warn(`${modelName} does not export a Promise with the same name!`);
            
        }
    } 
}

module.exports = { modelsInit };