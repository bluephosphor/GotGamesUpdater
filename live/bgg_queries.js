const [UNSENT, OPENED, HEADERS_RECIEVED, LOADING, DONE] = [0, 1, 2, 3, 4];

const game_query = (id) => `https://api.geekdo.com/xmlapi2/thing?id=${id}`;
const user_link = 'https://api.geekdo.com/xmlapi2/collection?username=GreatOaksTavern';

function update_database() {
    //get our list of ids from firestore
    const listRef = db.collection('games').doc("ID_LIST");

    listRef.get().then((doc) => {
        if (doc.exists) {
            const current_list = doc.data().list;

            //request updated list from bgg, compare to firestore list
            
            const xhr = new XMLHttpRequest();

            xhr.onreadystatechange = () => {
                switch (xhr.readyState) {
                    case DONE:
                        switch (xhr.status) {
                            case 200: //successful response
                                const { serverTimestamp } = firebase.firestore.FieldValue;
                                const parser = new DOMParser();
                                const xmlDOM = parser.parseFromString(xhr.responseText, 'application/xml');
                                const gamesList = xmlDOM.querySelectorAll('item');
                                let id_list = [];
                                let owned;

                                gamesList.forEach(game => {
                                    owned = game.querySelector('status').attributes.own.nodeValue;  //xml querying :')
                                    if (owned == 1) id_list.push(game.attributes.objectid.nodeValue);
                                });

                                //if no changes, exit early

                                //otherwise, filter down list to only what is new

                                //update our id_list

                                //listRef.update({
                                    //list: id_list,
                                    //lastUpdate: serverTimestamp()
                                //});

                                //query each item in 10 second intervals, add info to firestore

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