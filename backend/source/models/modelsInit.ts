import fs from "graceful-fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

type ModelInitializer = () => Promise<void>;

// goes through ./models and calls their promise to initialize tables if they do not exist
export default async function modelsInit() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const modelsDir = __dirname;
    const files = fs.readdirSync(modelsDir)
        .filter(file => file.endsWith(".js") && file !== "modelsInit.js"); // ignore this source

    for(const file of files) {
        const modelPath = path.join(modelsDir, file);
        const modelUrl = pathToFileURL(modelPath).href;
        
        // removing .js extension to call the model
        const modelName = path.basename(file, ".js");

        let imported: any;
        try{
            imported = await import(modelUrl);
        } catch(error) {
            console.error(error);
            continue;
        }

        const initializer: unknown = imported.default;

        if(!initializer) {
            console.warn(`${modelName} has no default export so it was skipped!`);
            continue;
        }

        try{
            if(typeof initializer === "function") {
                const result = initializer();
                if(result instanceof Promise) {
                    await result;
                }
            } else if( initializer instanceof Promise) {
                await initializer;
            } else {
                console.warn(`${modelName} default export is not a function or a Promise so it was skipped!`);
                continue;
            }
        } catch(error) {
            console.error(error);
        }
    } 
}