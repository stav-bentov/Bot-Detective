/*const apiUrl = "http://localhost:5000/isBot/username";
let timeoutId; // Variable to store the timeout ID



function getUsernames() {
    const users = Array.from(document.querySelectorAll('span.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0'))
        .map(span => span.innerText)
        .filter(username => username !== null && username.startsWith('@'));
    //console.log(users);
    users.forEach( user => {
        const username = user.substring(1)
        fetch(`http://127.0.0.1:5000/isBot/${username}`)
            .then(response => response.json())
            .then(data => {
                console.log("the result for ",user, "is: ", data);
            })
            .catch(error => {
                console.log("error for ",user);
            });
    })
}


document.addEventListener('load', () => {
    // Function to be executed once the page is loaded
    console.log('Page loaded!');
    getUsernames();
    // Perform any necessary actions here
});*/


/*  DOMNodeInserted : Fires when a node has been added as a child of another node (element of an HTML, XML, or XHTML document that can be manipulated through JavaScript).
    In our Twitter page- it detects when new tweets or users are loaded into the page dynamically without having to reload the entire page.*/
/*document.addEventListener('DOMNodeInserted', () => {
    clearTimeout(timeoutId);
    console.log("in event");
    timeoutId =  setTimeout(() => { getUsernames();}, 1000);
});*/
