import { Database } from 'sqlite3';

// Open a SQLite database, stored in the file: src/db.sqlite
const db = new Database('db.sqlite', (err: { message: string }) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Fetch a random integer between -99 and +99
db.get<{ result: number }>(
    'SELECT RANDOM() % 100 as result',
    (err: { message: string }, res: { result: number }) => {
        if (err) {
            console.error('Error executing query:', err.message);
        } else {
            console.log('Random integer:', res?.result);
        }
    }
);



// Fetch titles of the two articles with the longest descriptions
db.all<{ title: string }[]>(
    //   "SELECT title FROM articles ORDER BY LENGTH('description) DESC LIMIT 2",
    "select * from articles",
    (err: { message: string }, res: { title: string }[]) => {
        if (err) {
            console.error('Error executing select:', err.message);
        } else {
            console.log('Result:', res);
        }
    }
);

// // Update the title of an article
// const statement = db.prepare(
//     'UPDATE articles SET title = ? WHERE id = ?'
// );
// statement.run(["Third Article", 3], (err: { message: string }) => {
//     if (err) {
//         console.error('Error executing update:', err.message);
//     } else {
//         console.log('Update successful');
//     }
// });

// // Delete an article by id
// const delete_statement = db.prepare(
//     'DELETE FROM articles WHERE id = ?'
// );
// delete_statement.run([3], (err: { message: string }) => {
//     if (err) {
//         console.error('Error executing delete:', err.message);
//     } else {
//         console.log('Delete successful');
//     }
// });

db.close();
