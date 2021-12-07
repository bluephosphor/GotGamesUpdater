const [UNSENT, OPENED, HEADERS_RECIEVED, LOADING, DONE] = [0, 1, 2, 3, 4];

const id = id => document.getElementById(id);

const game_query = (id) => `https://api.geekdo.com/xmlapi2/thing?id=${id}`;
const user_link  = 'https://api.geekdo.com/xmlapi2/collection?username=GreatOaksTavern';
var query_list;
var current_item;
var interval;
var index = 0;
var item_count = 0;

function update_database() {

    //get our list of ids from firestore
    const listRef = db.collection('games').doc("ID_LIST");
    
    listRef.get().then((doc) => {
        if (doc.exists) {
            const current_list = doc.data().list;

            //request updated list from bgg
            
            const xhr = new XMLHttpRequest();

            xhr.onreadystatechange = () => {
                switch (xhr.readyState) {
                    case DONE:
                        switch (xhr.status) {
                            case 200: //successful response
                                const { serverTimestamp } = firebase.firestore.FieldValue;
                                let parser = new DOMParser();
                                let xmlDOM = parser.parseFromString(xhr.responseText, 'application/xml');
                                const gamesList = xmlDOM.querySelectorAll('item');
                                let new_list = [];
                                let owned;

                                //once we have response xml, boil it down into an array of ids

                                gamesList.forEach(game => {
                                    // making sure we only add ids of games marked as 'owned'
                                    
                                    owned = game.querySelector('status').attributes.own.nodeValue;
                                    
                                    if (owned == 1) {
                                        new_list.push(game.attributes.objectid.nodeValue);
                                    }
                                });
                                
                                //compare to firestore list

                                let same = arrayEquals(new_list,current_list);

                                //if no changes, exit early

                                if (same) {
                                    console.log('Values are the same. No need to update');
                                    //return;
                                }

                                //otherwise, filter down list to only what is new

                                //update our current_list

                                //listRef.update({
                                    //list: new_list,
                                    //lastUpdate: serverTimestamp()
                                //});

                                //query each item in 10 second intervals, add info to firestore

                                query_list  = new_list;
                                item_count  = query_list.length;
                                interval    = setInterval(db_update_step, 10000);
                                db_update_step();

                                break;
                            case 404: //unsuccessful response
                                console.log('File or resource not found.');
                                break;
                        }
                        break;
                }
            };

            xhr.open('get', user_link, true);
            xhr.send();

        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
        }
    }).catch((error) => {
        console.log("Error getting document:", error);
    });
}

function db_update_step(){
    
    if (query_list.length <= 0) {
        id('update-info').innerText = "Done!";
        clearInterval(interval);
        return 1;
    }

    current_item = query_list.pop();
    id('update-info').innerText = 'Making request...';
    
    get_game_data(game_query(current_item));

}

async function get_game_data(link){
    fetch(link)
        .then(response => response.text())
        .then(data => {
            //get our top level data from the xml.....
            let parser                  = new DOMParser();
            let xmlDOM                  = parser.parseFromString(data, 'application/xml');
            let game                    = xmlDOM.querySelector('item');
            let name                    = game.querySelector('name').attributes.value.nodeValue;
            let year                    = game.querySelector('yearpublished').attributes.value.nodeValue;
            let minplayers              = game.querySelector('minplayers').attributes.value.nodeValue;
            let maxplayers              = game.querySelector('maxplayers').attributes.value.nodeValue;
            let playingtime             = game.querySelector('playingtime').attributes.value.nodeValue;
            let minage                  = game.querySelector('minage').attributes.value.nodeValue;
            let image                   = game.querySelector('image').innerHTML;
            let thumbnail               = game.querySelector('thumbnail').innerHTML;
            let description             = game.querySelector('description').innerHTML;
            
            //now time for polls
            let polls                   = game.querySelectorAll('poll');
            let arr = []; 
            let recplayers = 0;
            polls.forEach(poll => {
                //we're gonna iterate through each of them and add their data
                let results = poll.querySelectorAll('results');
                let subArr = [];
                results.forEach(entry =>{
                    let subResults = entry.querySelectorAll('result');
                    let data = {};
                    subResults.forEach(result =>{
                        data[result.attributes.value.nodeValue] = result.attributes.numvotes.nodeValue;
                    })
                    if (results.length > 1) data.numplayers = entry.attributes.numplayers.nodeValue;

                    subArr.push(data);
                })
                if (subArr.length > 1) recplayers = subArr.reduce((pre, cur) => {
                    return (parseInt(cur.Best) > parseInt(pre.Best)) ? cur : pre
                });
                
                arr.push({
                    name: poll.attributes.name.nodeValue,
                    title: poll.attributes.title.nodeValue,
                    totalvotes: poll.attributes.totalvotes.nodeValue,
                    results: subArr
                });
            });
            
            polls = arr;
            
            index++;
            id('update-info').innerText = 
            `Getting info for item ${index.toString()} of ${item_count.toString()}... 
            name: ${name}
            BGG id: ${current_item}`;
            
            id('game-img').src = thumbnail;

            let obj = {
                name,
                image,
                thumbnail,
                year,
                minplayers,
                maxplayers,
                recplayers: recplayers.numplayers,
                playingtime,
                minage,
                description,
                polls
            };
            console.log(obj);
            db.collection("games").doc(current_item).set(obj);
        })
}

function arrayEquals(a, b) {
    return (
        Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index])
    );
}