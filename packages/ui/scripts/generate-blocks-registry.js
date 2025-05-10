const fs = require('fs');
const path = require('path');

/**
 * Generate a blocks registry JSON by scanning the filesystem
 */
async function generateBlocksRegistry() {
  const blocksDir = path.join(__dirname, '../src/blocks');
  const outputPath = path.join(__dirname, '../src/blocks.json');
  
  console.log('Generating blocks registry...');
  
  // Ensure the blocks directory exists
  if (!fs.existsSync(blocksDir)) {
    console.error(`Blocks directory not found: ${blocksDir}`);
    process.exit(1);
  }
  
  const registry = {};
  
  // Get all folder categories
  const folders = fs.readdirSync(blocksDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
    .map(dirent => dirent.name);
    
  for (const folderName of folders) {
    const folderPath = path.join(blocksDir, folderName);
    const subFolders = fs.readdirSync(folderPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
      .map(dirent => dirent.name);
    
    registry[folderName] = [];
    
    for (const subFolderName of subFolders) {
      const blockFolderPath = path.join(folderPath, subFolderName);
      const blockFilePath = path.join(blockFolderPath, '_block.tsx');
      const thumbnailPath = path.join(blockFolderPath, '_thumbnail.png');
      
      // Check if _block.tsx exists
      if (fs.existsSync(blockFilePath)) {
        const fileContent = fs.readFileSync(blockFilePath, 'utf8');
        
        // Extract block properties using regex pattern matching
        const nameMatch = fileContent.match(/name:\s*["']([^"']+)["']/);
        const descriptionMatch = fileContent.match(/description:\s*["']([^"']+)["']/);
        
        const blockInfo = {
          name: subFolderName,
          path: `${folderName}/${subFolderName}`,
          displayName: nameMatch ? nameMatch[1] : subFolderName,
          description: descriptionMatch ? descriptionMatch[1] : '',
          hasThumbnail: fs.existsSync(thumbnailPath)
        };
        
        registry[folderName].push(blockInfo);
      }
    }
  }
  
  // Write the registry to a JSON file
  fs.writeFileSync(outputPath, JSON.stringify(registry, null, 2));
  console.log(`Blocks registry generated at ${outputPath}`);
}

// Run the function if this file is executed directly
if (require.main === module) {
  generateBlocksRegistry().catch(console.error);
}

module.exports = generateBlocksRegistry;