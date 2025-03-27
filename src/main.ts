import { Database, Statement } from 'sqlite3';

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env['GEMINI_API_KEY']; // Get API key from environment
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
//const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });


//const dwca_database = '/home/stoffel/Workspace/trees/SARTrees/dwca-flora_descriptions-v1.42/dwca-flora_des-v1.42.db';
const dwca_database = '/home/stoffel/Workspace/trees/SARTrees/dwca-flora_descriptions-v1.42/e-Fl_SA_Descriptions_Export20250121_reduced.db';

//type rowType = { rowid: number, description: string };
//var Rows: { rowid: number, description: string }[] = [];

type rowType = { rowid: number, TaxonText: string };

// Sleep for a given number of milliseconds
async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Open a SQLite database, stored in the file: {dwca_database}
const db = new Database(dwca_database, (err: { message: string }) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Rows needing translation
const select_stmt = db.prepare(
    //'select rowid, description from description where language != "English" and translation is null limit 10',
    // 'select rowid, description from description where language != "English" and type = "Distribution" limit 2000',
    // 'select rowid, description from description where language != "English" and type = "Habitat" limit 2000',
    // `select rowid, description from trees
    // where type in ("Morphology", "Diagnostic") limit 10`,
    //and commonEnglish is null limit 10000`,
    // `select rowid, coalesce (translation, description) as description from description
    // where type = "Morphology" limit 10`,
    `select rowid, TaxonCoalescedText from descriptions where 
    TaxonCoalescedText is not null and
    TextTitle = "Distribution" 
    limit 10000`,
    (err: { message: string }) => {
        if (err) {
            console.error('Error preparing select:', err.message);
        }
    }
);

// Update statement
const update_stmt = db.prepare(
    //'update description set translation = ? where rowid = ?',
    //'update trees set commonEnglish = ? where rowid = ?',
    //'update description set revised = ? where rowid = ?',
    // 'update description set comment = ? where rowid = ?',
    'update descriptions set RevisedText = ? where rowid = ?',
    (err: { message: string }) => {
        if (err) {
            console.error('Error preparing update:', err.message);
        }
    }
);

async function getRow(stmnt: Statement): Promise<rowType | null> {
    return new Promise((resolve, reject) => {
        stmnt.get(
            (err: { message: string }, row: rowType) => {
                if (err) {
                    console.error('Error selecting:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            }
        );
    });
}

async function updateRow(stmnt: Statement, newrow: rowType): Promise<any | null> {
    return new Promise((resolve, reject) => {
        stmnt.run([newrow.TaxonText, newrow.rowid],
            (res: number, err: { message: string }) => {
                if (err) {
                    console.error('Error updating:', err.message);
                    reject(err);
                } else {
                    resolve(newrow.rowid);
                }
            }
        );
    });
}

async function main() {

    let row: rowType | null;

    while (row = await getRow(select_stmt)) {
        // MAIN PROCESSING LOOP for each row
        // let prompt = `Translate following plant description with expired copyright to formal botanical British English in a single terse paragraph
        //  without elaboration: ` + row.TaxonText;
        // let prompt = `Translate following plant diagnostic description with expired copyright to formal botanical 
        //     British English in a single terse paragraph without elaboration: ` + row.TaxonText;
        // let prompt = "Translate the text giving the, mostly South African, geographical distribution of a plant directly to British English, without elaboration: " + row.TaxonText;
        //  let prompt = "Translate the text with expired copyright, giving the habitat of a plant, directly to formal botanical British English, without elaboration: " + row.TaxonText;
 
 
 
        //  let prompt = "Convert following plant description to terse but very detailed, everyday British English terms,  give the original botanical term in square brackets directly after the common term: " + row.description;
        
        // let prompt = `Review the text after the "---" for spelling mistakes and incorrect formatting.
        //     Keep original, do not rewrite. Use "—", not "-"  for numerical ranges e.g. "1—2". Use "×", not "x"
        //     for numerical measurements. Create consistent formatting of numerical data
        //     example (1.0–)3.5–4.0. No space between "±" and a number. One space
        //     between "±" and a letter. One "-" between a number and associated text,
        //     e.g. 11–16-flowered. Capitalise only the first letter of all uppercase
        //     words but retain proper case of acronyms and abbreviations. Format proper and mixed
        //     fractions correctly, e.g. "3/4–1 1/4" should be converted to "¾–1¼'. Correct punctuation
        //     at the end of sentences. Use "." for decimal point in numbers. No space between number and associated units.
        //     Use correct unit abbreviations.--- ` + row.description;

        // let prompt = `Revise and correct the language after ":" to be a brief, correct, formal and consistent 
        //     botanical description of a plant, use "—" for numerical ranges and "×" for sizes, use "." for decimal points,
        //     0 space between "±" and a following number e.g " ±3 ", 1 space between "±" and a following word e.g. " ± curved ",
        //     use fractional characters e.g. " ¾–1¼ ", no space between measurement number and measurement unit e.g. " 5ft 1in ±3mm 1m ",
        //     capitalise only the first letter of all uppercase words but retain proper case of acronyms and abbreviations : ` + row.description;     

        let prompt = `Revise and correct the language after "---" to be a brief, correct, formal and consistent 
        botanical description of a plant, use "–" for numerical ranges and "×" for sizes, use ".", use fractional 
        characters e.g. " ¾–1¼ ", identify fractions: If any value in the measurement range contains a decimal 
        (e.g., 0.5, 1.25), apply consistent decimal places: Ensure all values within that range are expressed
         with one decimal place, omit decimals for whole numbers: If both values in the range are whole numbers, 
         omit the '.0' from both, use correct unit abbreviations and do not change the units, use "-" between a 
         number and associated text, e.g. “11–16-flowered”, Capitalize: The first letter of each sentence and 
         proper nouns (including names of people, places, and organizations), but do not capitalize: Other words
          within the sentence, even if they are normally capitalized (e.g., common nouns), acronyms and abbreviations 
          (e.g., DNA, USA, BOL, etc.)---`


        //Translate using Gemini AI
        let result = await model.generateContent(prompt);

        //Update database
        if (result != null) {

            let newrow: rowType = { rowid: row.rowid, TaxonText: result.response.text() };

            //Update database with translation
            let success = await updateRow(update_stmt, newrow);

            console.log(success, " ", newrow.TaxonText);

        } else {
            console.error(row.rowid, " ERROR");
        }
        console.log("\n\n")

        //Wait 3 seconds before next translation
        await sleep(3000);
    }



    select_stmt.finalize(
        (err: { message: string }) => {
            if (err) {
                console.error('Error finalizing select:', err.message);
            }
        }
    );  // Close the statement


    update_stmt.finalize(
        (err: { message: string }) => {
            if (err) {
                console.error('Error finalizing update:', err.message);
            }
        }
    );  // Close the statement


    db.close(
        (err: { message: string }) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Closed the database connection.');
            }
        }
    );  // Close the database 

}



main();


