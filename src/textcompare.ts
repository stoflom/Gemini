//Compute  Levenshtein Distance and Jaccard similarity between original and translated texts


import { Database, Statement } from 'sqlite3';
import { wordDiff } from './textdiff';


//const dwca_database = '/home/stoffel/Workspace/trees/SARTrees/dwca-flora_descriptions-v1.42/dwca-flora_des-v1.42.db';
//const dwca_database = '/home/stoffel/Workspace/trees/SARTrees/dwca-flora_descriptions-v1.42/e-Fl_SA_Descriptions_Export20250121_reduced.db';
const dwca_database = '/home/stoffel/Workspace/trees/SARTrees/dwca-flora_descriptions-v1.42/e-Fl_SA_Descriptions_Export20250128_reduced.db';

// type rowType = { rowid: number, TaxonText: string, Translation: string };
type rowType = { rowid: number, CoalescedText: string, RevisedText: string };

// Open a SQLite database, stored in the file: {dwca_database}
const db = new Database(dwca_database, (err: { message: string }) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Rows needing comparison
// const select_stmt = db.prepare(
//     `select rowid, TaxonText, Translation from descriptions where 
//     Translation <> '' and
//     LevenshteinOld is null
//     limit 150000`,

const select_stmt = db.prepare(
    `select rowid, CoalescedText, RevisedText from descriptions where 
    RevisedText <> '' and
    Levenshtein is null
    limit 50000`,
    (err: { message: string }) => {
        if (err) {
            console.error('Error preparing select:', err.message);
        }
    }
);

// Update statement
const update_stmt = db.prepare(
    // 'update descriptions set DiffText = ?, LevenshteinOld = ?, JaccardOld = ? where rowid = ?',

    'update descriptions set DiffText = ?, Levenshtein = ?, Jaccard = ? where rowid = ?',
    (err: { message: string }) => {
        if (err) {
            console.error('Error preparing update:', err.message);
        }
    }
);

function levenshteinDistance(a: string, b: string): number {
    // Compute the Levenshtein distance between two strings (character based)
    // Example usage
    //   const str1 = "kitten";
    //   const str2 = "sitting";

    //   const distance = levenshteinDistance(str1, str2);
    //   console.log(`Levenshtein Distance: ${distance}`);

    const matrix = [];

    // Initialize the matrix
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j] + 1 // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}




function jaccardSimilarity(text1: string, text2: string): number {
    //Compute Jaccard similarity index based on word tokens 

    // Example usage
    //   const text1 = "The quick brown fox jumps over the lazy dog";
    //   const text2 = "The quick brown dog jumps over the lazy fox";
    // const similarity = jaccardSimilarity(text1, text2);
    // console.log(`Jaccard Similarity: ${similarity}`);


    // Helper function to tokenize text into a set of words, filter to return only defined values
    function tokenize(text: string): Set<string> {
        return new Set(text.toLowerCase().split(/\W+/).filter(Boolean));
    }

    const set1 = tokenize(text1);
    const set2 = tokenize(text2);

    const intersection = new Set([...set1].filter(word => set2.has(word)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
}


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

async function updateRow(stmnt: Statement, rowid: number, difftext: string, levenshtein: number, jaccard: number): Promise<any | null> {
    return new Promise((resolve, reject) => {
        stmnt.run([difftext, levenshtein, jaccard, rowid],
            (res: number, err: { message: string }) => {
                if (err) {
                    console.error('Error updating:', err.message);
                    reject(err);
                } else {
                    resolve(rowid);
                }
            }
        );
    });
}

async function main() {

    let row: rowType | null;

    let levenshtein: number;
    let jaccard: number;
    let DiffText: string;

    while (row = await getRow(select_stmt)) {
        // MAIN PROCESSING LOOP for each row

        //Compute Levenshtein Distance
        levenshtein = levenshteinDistance(row.CoalescedText, row.RevisedText);
        //Compute Jaccard Similarity
        jaccard = jaccardSimilarity(row.CoalescedText, row.RevisedText);
        //Diffe the texts
        DiffText = wordDiff(row.CoalescedText, row.RevisedText);

        //Update database
        let success = await updateRow(update_stmt, row.rowid, DiffText, levenshtein, jaccard);

        console.log(row.rowid, " Levenshtein=", levenshtein, " Jaccard=", jaccard, "\n");

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


