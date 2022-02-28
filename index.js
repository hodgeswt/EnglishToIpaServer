const express = require("express");
const app = express();
const port = process.env.PORT || 80;

var MediaWiki = require("mediawiki");
var bot = new MediaWiki.Bot({
  endpoint: "https://en.wiktionary.org/w/api.php",
  rate: 60e3 / 10,
  userAgent: "ExampleBot <https://en.wiktionary.org/wiki/User:Example>",
  byeline: "(example bot)",
});

app.get("/:word", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const word = req.params.word.toLowerCase().trim();
  var text = "";
  bot
    .get({
      action: "query",
      titles: word,
      prop: "revisions",
      rvprop: "content",
    })
    .complete(function (response) {
      var ids = response.query.pages;
      if (ids) {
        Object.keys(ids).forEach((id) => {
          if (ids[id].revisions != undefined) {
            text = ids[id].revisions[0]["*"];
          }
        });
      }
      if (text && text == "") {
        res.send('{"error": "No pronunciation found"}');
      } else {
        const prons = text.match(/(\* \{\{.+)?\{\{IPA\|en\|.+\}\}/g);
        var target = "";
        if (prons) {
          if (prons.length == 1) {
            target = prons[0];
          } else if (prons.length > 1) {
            var sent = false;
            prons.forEach((element) => {
              if (element.includes("GA") || element.includes("US")) {
                target = element;
                sent = true;
              }
            });
            if (!sent) {
              target = prons[0];
            }
          }
        } else {
          res.send('{"error": "No pronunciation found"}');
          return;
        }

        // Extract the IPA
        const ipa = target.match(/\{\{IPA\|en\|(.+)\}\}/);
        if (ipa) {
          res.send(`{"success": "${ipa[1].replaceAll("|", " ")}"}`);
          return;
        } else {
          res.send('{"error": "No pronunciation found"}');
          return;
        }
      }
    })
    .error(function (err) {
      res.send('{"error": "No pronunciation found"}');
    });
});

app.listen(port, () => {});
