const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs')


app.set("view engine" , "ejs")
app.use(express.json());
app.use(express.urlencoded({ extended:true}));
app.use(express.static(path.join(__dirname , "public")))


app.get("/", function (req, res) {
    
    fs.readdir("./files", function (err, files) {
        if (err) {
            console.error(err);
            res.status(500).send("Error reading files");
        } else {
            const formattedFiles = files.map(file => {
                const stats = fs.statSync(`./files/${file}`);
                const details = fs.readFileSync(`./files/${file}`, 'utf-8') || "";

                return {
                    name: file.replace(".txt", "").replace(/([A-Z])/g, " $1").trim(),
                    fileNameCamelCase: file, 
                    details: details ,
                    mtime: stats.mtime 
                };
            })
            .sort((a, b) => b.mtime - a.mtime); 
            res.render("index", { files: formattedFiles, error: req.query.error });
        }
    });
});

app.post("/create", function (req, res) {
    const { title, details } = req.body;

    if (!title && !details) {
        return res.redirect("/?error=Title and details are required.");
    }
    // Convert the title to CamelCase for saving
    const camelCaseTitle = req.body.title
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("");

    fs.writeFile(`./files/${camelCaseTitle}.txt`, req.body.details, function (err) {
        if (err) {
            console.error(err);
            res.status(500).send("Error creating file");
        } else {
            res.redirect("/");
        }
    });
});
app.get("/file/:filename", function(req, res){
    // Ensure .txt is not appended twice, only if it's missing
    const filePath = `./files/${req.params.filename.endsWith('.txt') ? req.params.filename : req.params.filename + '.txt'}`;

    fs.readFile(filePath, 'utf-8', function(err, filedata){
        if (err) {
            console.error(err);
            return res.status(500).send("Error reading file");
        }

        // Remove .txt extension for displaying the filename
        const formattedFilename = req.params.filename.replace(".txt", "").replace(/([A-Z])/g, " $1").trim();

        // Render the file content with the formatted filename
        res.render("show", { 
            filename: formattedFilename, 
            filedata: filedata
        });
    });
});


app.post("/delete/:filename" , function(req, res){
    const filePath = `./files/${req.params.filename}`
    fs.unlink(filePath , function(err){
        if(err){
            console.error(err)
            res.status(500).send("Error deleting file")
        }else{
            res.redirect("/?message=Note+deleted+successfully");        }
    })
})
app.listen(3000)

module.exports = app;
