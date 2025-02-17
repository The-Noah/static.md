const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");

const metadataParser = require("markdown-yaml-metadata-parser");
const lineEndingConverter = require("convert-newline")("lf").string();
const sass = require("node-sass");

const colorConsole = require("./lib/color-console");

let config = {
  src: "src",
  dist: "dist",
  siteName: "My Blog"
};

let configPath = "static.md.config.json";

if(process.argv[3]){
  configPath = process.argv[3];
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

const build = () => {
  if(!fs.existsSync(config.src)){
    return colorConsole.error("error: source path does not exist");
  }
  
  fs.emptyDirSync(config.dist);
  if(fs.existsSync(path.join(config.src, "static"))){
    colorConsole.info("copying static files");
    fs.copySync(path.join(config.src, "static"), path.join(config.dist, "static"));
  }else{
    fs.mkdirSync(path.join(config.dist, "static"));
  }
  
  // render markdown files
  glob("**/*.md", {cwd: config.src}, (err, files) => {
    if(err){
      return colorConsole.error("error: unable to get source markdown files");
    }
  
    const render = require("./lib/render")(config, files.filter((file) => path.parse(file).name !== "index").map((file) => {
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
  
  // render scss files
  glob("**/*.scss", {cwd: config.src}, (err, files) => {
    if(err){
      return colorConsole.error("error: unable to get source scss files");
    }
  
    files.forEach((file) => {
      sass.render({
        file: path.join(config.src, file),
        outputStyle: "compressed"
      }, (err, result) => {
        if(err){
          return colorConsole.error(err);
        }

        file = path.parse(file);
        fs.writeFile(path.join(config.dist, "static", file.name + ".css"), result.css, (err) => {
          if(err){
            return colorConsole.error(err);
          }
  
          colorConsole.success(`rendered ${file.base} to css`);
        });
      });
    });
  });
};

if(process.argv[2] === "build"){
  build();
}else if(process.argv[2] === "watch"){
  build();

  fs.watch(config.src, (event, filename) => {
    if(filename){
      colorConsole.info(`${filename} has changed, rebuilding`);
      build();
    }
  });
}else{
  colorConsole.error("invalid command-line arguments. usage: build|watch [config]");
}
