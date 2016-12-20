Organizes the Cards Against Humanity card spreadsheet into a JSON file structure.  Eventually will put into Elasticsearch for easy searching.

1. npm install
2. Find Cards Against Humanity card spreadsheet on google drive (look at cardsagainsthumanity subreddit)
3. Export spreadsheet as excel document, place name it `cah-cards.xlsx`.
4. Make a `data` folder in this dir, place `.xlsx` file in the directory.

This script makes heavy assumptions about the formatting of the spreadsheet, much more so on the grid structured set listings.  If the formatting is ever changed, this script needs to be updated.