const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion")
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponseGenerating = false;

//API configuration
const API_KEY ="AIzaSyC7Nm9yz5QMYlVF_mZzYZ3rPf6UAu6nDsc";
const API_URL =`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const loadLocalstorageData = () => {
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");
    const savedChats = localStorage.getItem("savedChats");

    //apply the stored theme
    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    //Restore saved chats
    chatList.innerHTML = savedChats || "";

    document.body.classList.toggle("hide-header", savedChats); //hide the header once the chat start
    chatList.scrollTo(0, chatList.scrollHeight); //scroll to the bottom
}

loadLocalstorageData();

// Create a new message element and return it
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content; 
    return div;
};

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currenWordIndex = 0;

    const typingInterval = setInterval (() => {
        //append each word to the text element with a space
        textElement.innerText += (currenWordIndex === 0 ? '' : ' ') + words[currenWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");
        //if all words are displayed
        if(currenWordIndex === words.length){
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats", chatList.innerHTML); //save chats to local storage
            chatList.scrollTo(0, chatList.scrollHeight); //scroll to the bottom
        }
    }, 75);
}

//fetch response from the API based on user message
const  generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text"); //get text element


    // Send a POST request to the API with the user's message
    try{
        const response = await fetch(API_URL,{
            method:"POST",
            headers:{ "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts:[{ text: userMessage}]
                }]
            })

        });

        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message);

        //get API response text and remove asteriks from it 
       const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
       showTypingEffect(apiResponse, textElement, incomingMessageDiv);
    } catch(error){ 
        isResponseGenerating = false;
        textElement.innerText = error.message;
        textElement.classList.add("error");
    }finally{
        incomingMessageDiv.classList.remove("loading");
    }
}
//show a loading animtion while watching for the API response
const showLoadingAnimation = () => {
    const html = `<div class="message-content">
                <img src="./images/image1.jpg" alt="Gemini image" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);

    chatList.scrollTo(0, chatList.scrollHeight); //scroll to the bottom
    generateAPIResponse(incomingMessageDiv);


}

const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;
    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done"; //show tick icon
    setTimeout(() => copyIcon.innerText = "content_copy", 1000); // revert icon after 1 second
}

// Handle sending outgoing chat message
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if (!userMessage || isResponseGenerating) return; // Exit if there is no message

    isResponseGenerating = true;

    const html = `<div class="message-content">
                    <img src="./images/image2.jpg" alt="User image" class="avatar">
                    <p class="text"></p>
                  </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage; // Assign user message
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset(); // Clear the input field
    chatList.scrollTo(0, chatList.scrollHeight); //scroll to the bottom
    document.body.classList.add("hide-header"); //hide the header once the chat start
    setTimeout(showLoadingAnimation, 500); //show loading animation after a delay
};

//set user message and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});

//toggle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode" );
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

deleteChatButton.addEventListener("click", () => {
    if(confirm("Are you sure you want to delete all message?")) {
        localStorage.removeItem("savedChats");
        loadLocalstorageData();
    }
});

// Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});
