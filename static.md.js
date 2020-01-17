const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");

const metadataParser = require("markdown-yaml-metadata-parser");
const lineEndingConverter = require("convert-newline")("lf").string();

const colorConsole = require("./lib/color-console");

let config = {
  src: "src",
  dist: "dist"
};

let configPath = "static.md.config.json";

if(process.argv[2]){
  configPath = process.argv[2];
}

if(fs.existsSync(configPath)){
  colorConsole.info(`using config '${configPath}'`);
  config = {
    ...config,
    ...JSON.parse(fs.readFileSync(configPath, "utf8"))
  };
}else{
  colorConsole.info("using default config");
}

if(!fs.existsSync(config.src)){
  return colorConsole.error("error: source path does not exist");
}

fs.emptyDirSync(config.dist);
fs.copySync(path.join(config.src, "static"), path.join(config.dist, "static"));

glob("**/*.md", {cwd: config.src}, (err, files) => {
  if(err){
    return colorConsole.error("error: unable to get source markdown files");
  }

  const render = require("./lib/render")(config.src, files.filter((file) => path.parse(file).name !== "index").map((file) => {
    const page = path.parse(file);

    const fileContent = lineEndingConverter(fs.readFileSync(path.join(config.src, file), "utf8"));
    const markdown = metadataParser(fileContent);

    return {
      title: markdown.metadata.title,
      location: `${page.dir}/${page.name}.html`,
      description: markdown.metadata.description,
      author: markdown.metadata.author
    };
  }));

  files.forEach((file) => {
    render(path.join(config.src, file), path.join(config.dist, path.parse(file).dir));
  });
});
