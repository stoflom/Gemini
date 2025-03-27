import { Database, Statement } from 'sqlite3';
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env['GEMINI_API_KEY']; // Get API key from environment
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


const dwca_database = '/home/stoffel/Workspace/trees/SARTrees/dwca-flora_descriptions-v1.42/e-Fl_SA_Descriptions_Export20250128_reduced.db';

//type rowType = { rowid: number, TaxonText: string };
type rowType = { rowid: number, CoalescedText: string };

const API_RETRY_DELAY_MS = 10000; // retry initially after 10 seconds.
const API_MAX_RETRIES = 5; // try a max of five times
const API_DELAY_MS = 1000; // 1 second delay after success

// Sleep for a given number of milliseconds
async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Open a SQLite database, stored in the file: 
const db = new Database(dwca_database, (err: { message: string }) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Rows needing translation
const select_stmt = db.prepare( //NOTE: if the colums selected change, the rowType must be updated
    // `select rowid, TaxonText FROM descriptions
    //     WHERE Language != "English" AND
    //     Translation == '' AND
    //     TextTitle IN ("Morphology", "Distribution")
    //     limit 5000`,
    `select rowid, CoalescedText from descriptions where 
    CoalescedText is not null and
    TextTitle In  ("Distribution", "Habitat", "General", "Ecology") and
    RevisedText = ''
    limit 50000`,
    (err: { message: string }) => {
        if (err) {
            console.error('Error preparing select:', err.message);
        }
    }
);

// Update statement
const update_stmt = db.prepare(
    'update descriptions set RevisedText = ? where rowid = ?',
//    'update descriptions set Translation = ? where rowid = ?',
    (err: { message: string }) => {
        if (err) {
            console.error('Error preparing update:', err.message);
        }
    }
);

async function getRow(stmnt: Statement): Promise<rowType | null> {
    return new Promise((resolve, reject) => {
        stmnt.get((err: { message: string }, row: rowType) => {
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
        stmnt.run([newrow.CoalescedText, newrow.rowid],
            (err: { message: string }) => {
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

async function processDescription(row: rowType): Promise<boolean> {

    //   let prompt = `Translate following plant description with expired copyright to formal botanical British English in a single terse paragraph
    //      without elaboration: ` + row.TaxonText;

// const prompt = `
// Improve the format of botanical description following after --- using these rules: 

// Units: Use standard abbreviations (e.g., ft, lin, m, mm, cm, µm, NOT ft., lin., m., mm., cm.,
// pm., ft, lin). Do not add a period after the unit abbreviation. Do not convert measurements.

// Fractions: Convert fractions written with a slash (e.g., 1/2, 3/4, 1 1/5) into their corresponding
// fraction symbols (e.g., ½, ¾, 1⅕). This conversion should be performed before any other numerical
// formatting, including decimal consistency adjustments. Mixed Fractions: When dealing with mixed
// fractions (e.g., 2 1/4), ensure that the fractional part is converted to its special character
// equivalent (e.g., 2¼) before applying other formatting rules.

// Numerical Ranges: Use an en dash (–) for numerical ranges (e.g., 2–5, 10–20). Do not use a hyphen (-). 
// Use a multiplication symbol (×) for dimensions (e.g., 2 × 3, 10 × 20). Do not use "x". 
// Retain brackets, and symbols (±) or abbreviations (ca.) Numbers should be flush to brackets. Examples: 
// 1–4 (–6) flowered becomes 1–4(–6)-flowered
// (80)120-380 x (30)60-100 becomes (80–)120–380 × (30–)60–100
// ca. 10-11(13) becomes ca. 10–11(–13)
// ±(2) 3.5-4 becomes  ±(2–)3.5–4.0

// Independent Range Evaluation: Each numerical range within an expression (including those separated
// by the multiplication symbol ×) should be evaluated independently for decimal consistency.

// Always ensure consistency in decimal places within each individual range, including those within
// brackets. If one value in a range has a decimal, all values in that range (or bracketed range) should
// have the same number of decimal places. If a range (or bracketed range) contains only whole numbers,
// do not add decimals. Decimal Consistency with Multiplication: When ranges are combined with the
// multiplication symbol (×), apply decimal consistency rules to each individual range separately.
// For example, in the expression '4–5.8 × 0.6–1 mm', '4–5.8' should be treated as one range
// and '0.6–1' as another. First Number in Multiplication Range: Even if the first number in a range
// within a multiplication expression is a whole number, it should still have a decimal added if
// another number in the same range has a decimal. For instance, '1–3.5' becomes '1.0–3.5'. Decimal
// Consistency with brackets: Apply decimal consistency
// rules separately to ranges within parentheses/brackets. If a value within the bracketed range has
// a decimal, all values within that bracketed range should have the same decimal precision.
// Examples: 1-1.5 becomes 1.0–1.5 
// 2-3 x 1.5-4 becomes 2–3 × 1.5–4.0 
// 5 remains 5 
// 2-3 remains 2–3 
// 1.2-2.5 x 3-4 becomes 1.2–2.5 × 3–4 
// 1-2 x 3-4.5 becomes 1–2 × 3.0–4.5 
// 1-2.5 x 3-4 becomes 1.0–2.5 × 3–4 
// 8-13, (3.5-)4-6 becomes 8–13, (3.5–)4.0–6.0

// Spacing: Use a space after numbers and before units (e.g., 5 mm, not 5mm). 

// Punctuation: Use a period (.) at the end of a sentence where punctuation is lacking. 

// Capitalization: Capitalize the first word of each sentence, proper nouns (including names of
// people, places, and organizations), and after colons. Do not capitalize other words within the
// sentence, even if they are normally capitalized (e.g., common nouns). Capitalize acronyms (e.g., DNA, USA, BOL). 

// Word Forms: Correct any misspellings and ensure proper grammatical form (e.g., "basal" not "basl," "lemma" not "lema"). 
      
// Exclude references.

// Do not block due to RECITATION, copyright has been cleared.

//  ---` + row.CoalescedText;

const prompt = `Improve the format of the plant habitat or Southern African distribution
following after --- using these rules: 

Do not paraphrase or summarize the text.

Units: Use standard abbreviations (e.g., ft, lin, m, mm, cm, µm, NOT ft., lin., m., mm., cm.,
pm., ft, lin). Do not add a period after the unit abbreviation. Do not convert measurements.

Punctuation: Use a period (.) at the end of a sentence where punctuation is lacking. 

Capitalization: Capitalize the first word of each sentence, proper nouns (including names of
people, places, and organizations), and after colons. Do not capitalize other words within the
sentence, even if they are normally capitalized (e.g., common nouns). Capitalize acronyms (e.g., DNA, USA, BOL). 

Word Forms: Correct any misspellings (e.g., "basal" not "basl," "lemma" not "lema"). 
      
Exclude references.

Do not block due to RECITATION, copyright has been cleared.

---` + row.CoalescedText;


    let retries = 0;
    while (retries < API_MAX_RETRIES) {
        try {
            const result = await model.generateContent(prompt);
            if (result) {
                const newrow: rowType = { rowid: row.rowid, CoalescedText: result.response.text() };
                const success = await updateRow(update_stmt, newrow);
                console.log(success, " ", newrow.CoalescedText);
                return true;
            } else {
                console.error(`Row ${row.rowid}: API returned no result`);
                return false;
            }
        }
        catch (error: any) {
            console.error(`Row ${row.rowid}: API error:`, error.message);
            retries++;
            await sleep(API_RETRY_DELAY_MS*retries); // Wait ever longer before retrying
        }
    }
    console.error(`Row ${row.rowid}: Max retries exceeded, skipping row`);
    return false
}

async function main() {

    let row: rowType | null;
    while (row = await getRow(select_stmt)) {
        const success = await processDescription(row);
        if (success) {
            await sleep(API_DELAY_MS); //delay after success to reduce impact on API
        }
    }

    select_stmt.finalize((err: { message: string }) => {
        if (err) {
            console.error('Error finalizing select:', err.message);
        }
    });

    update_stmt.finalize((err: { message: string }) => {
        if (err) {
            console.error('Error finalizing update:', err.message);
        }
    });

    db.close((err: { message: string }) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Closed the database connection.');
        }
    });
}

main();
