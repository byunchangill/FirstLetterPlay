import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const directoryPath = 'public/images';
const historyFilePath = path.join(directoryPath, 'optimize_history.json');

let processedFiles = [];
if (fs.existsSync(historyFilePath)) {
    processedFiles = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
}

function saveHistory() {
    fs.writeFileSync(historyFilePath, JSON.stringify(processedFiles, null, 2));
}

async function processDirectory(dirPath) {
    const absoluteDirPath = path.resolve(dirPath);
    try {
        const files = fs.readdirSync(absoluteDirPath);

        for (const file of files) {
            const filePath = path.join(absoluteDirPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                await processDirectory(filePath);
            } else if (stats.isFile() && file.toLowerCase().endsWith('.png')) {
                const relativePath = path.relative(path.resolve('public/images'), filePath).replace(/\\/g, '/');

                if (processedFiles.includes(relativePath)) {
                    continue; // Skip already optimized files
                }

                // We know all files in "matching" were processed in the previous run.
                // If history doesn't exist yet, we'll assume they are already processed and skip.
                if (!fs.existsSync(historyFilePath) && relativePath.startsWith('matching/')) {
                    processedFiles.push(relativePath);
                    continue;
                }

                console.log(`Processing: ${relativePath}`);
                const tempPath = path.join(absoluteDirPath, `temp_${file}`);

                try {
                    const pipeline = sharp(filePath);

                    // Resize for items and characters, keep background/ui as original size.
                    if (relativePath.startsWith('matching/') || relativePath.startsWith('characters/')) {
                        pipeline.resize({ width: 256, withoutEnlargement: true });
                    }

                    await pipeline
                        .png({ quality: 80, compressionLevel: 9 })
                        .toFile(tempPath);

                    // Replace the original file with the compressed one
                    fs.unlinkSync(filePath);
                    fs.renameSync(tempPath, filePath);

                    processedFiles.push(relativePath);
                    saveHistory();
                    console.log(`Successfully optimized: ${relativePath}`);
                } catch (err) {
                    console.error(`Error processing ${relativePath}:`, err);
                }
            }
        }
    } catch (err) {
        console.error(`Error reading ${dirPath}:`, err);
    }
}

async function run() {
    console.log('Starting images optimization...');
    await processDirectory(directoryPath);
    saveHistory();
    console.log('Finished image optimization.');
}

run();
