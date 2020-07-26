//varicable to hold db Connection
let db;
//establish a connection to IndexedDB db 
const request = indexedDB.open('budget_tracker, 1');

//this event will emit if the DB version changes 
request.onupgradeneeded = function(event) {
    //save a reference to DB
    const db = event.target.result;
    //create an onject store(table) called 'new transaction set to an auto incremanting primary key
    db.createObjectStore('new_transaction', { autoincrement: true});
};

//upon a successfull 
request.onsuccess = function(event) {
    //when db is successfulle created with its object store (from onupgradeneeded even above) or simply established connection, save reference to dv in global variable
    db = event.target.result;
    
    //checkif app is online, if yes run uploadTransaction() function to send all local db to api 
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    //log error 
    console.log(event.target.errorCode);
};

//offline attempt for log a new transaction
function saveRecord(record) {
    //open new transaction with the db read/write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access the onbject store for 'new_transaction
    const budgetObjectStore = transaction.objectStore('new_transaction');

    //add record to your store with add method
    budgetObjectStore.add(record);
};

//function to collect object stpre and post to server when back online
function uploadTransaction() {
    //open a trasaction on your DB
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access your object store
    const budgetObjectStore = transaction.objectStore('new_transaction');
    
    //get all record from store and set to a variable
    const getAll = budgetObjectStore.getAll();


    //upon a sucessfull getall()  execution, run this function
    getAll.onsuccess = function() {
        //if there was data in indexedDB store, send it to the api server
        if (getAll.result.lenght > 0) {
            fetch('api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                //open one more transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                //access the new_transaction object Store
                const budgetObjectStore = transaction.objectStore('new_transaction');
                //clear all items in the store
                budgetObjectStore.clear();

                alert('All saved transactions have been submitted!');
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
};

// listen for app coming back online
window.addEventListener('online', uploadTransaction);
