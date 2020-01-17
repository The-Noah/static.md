const fs = require("fs-extra");
const path = require("path");

const ejs = require("ejs");

const showdown = require("showdown");
const markdownConverter = new showdown.Converter();

const metadataParser = require("markdown-yaml-metadata-parser");

const convertNewline = require("convert-newline");
const lineEndingConverter = convertNewline("lf").string();

const colorConsole = require("./color-console");

module.exports = (config, pages) => {
  const template = fs.readFileSync(path.join(config.src, "template.ejs"), "utf8");
  const indexTemplate = fs.readFileSync(path.join(config.src, "index.ejs"), "utf8");

  return async (filePath, buildPath) => {
    if(!filePath || !buildPath){
      return;
    }
  
    const file = path.parse(filePath);
  
    if(file.ext !== ".md"){
      return colorConsole.error(`skipping '${file.base}' because file extension is not .md`);
    }

    await fs.mkdirs(buildPath);

    fs.readFile(filePath, "utf8", (err, fileContent) => {
      if(err){
        return colorConsole.error(err);
      }

      fileContent = lineEndingConverter(fileContent);

      const markdown = metadataParser(fileContent);
      const html = ejs.render(file.name === "index" ? indexTemplate : template, {
        siteName: config.siteName,
        title: file.name,
        ...markdown.metadata,
        pages,
        body: markdownConverter.makeHtml(markdown.content)
      });

      fs.writeFile(path.join(buildPath, file.name + ".html"), html, (err) => {
        if(err){
          return colorConsole.error(err);
        }

        colorConsole.success(`rendered ${file.base} to html`);
      });
    });
  }
}