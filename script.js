/************************************************************** constants **************************************************************/
const BASE_URL = "https://mock-api.driven.com.br/api/v4/uol";
const VISIBLE_CHECKMARK =
  '<img src="imagens/checkmark.svg" alt="checkmark" class="visible">';
const INVISIBLE_CHECKMARK = '<img src="imagens/checkmark.svg" alt="checkmark">';

/********************************************************* generating HTML code ********************************************************/
/*** creating messages ***/
function createStatusMessage(data) {
  return `
    <div class="msg status-msg" data-identifier="message">
        <p><small>(${data.time})</small> <strong>${data.from}</strong> ${data.text}</p>
    </div>
    `;
}

function createDefaultMessage(data) {
  return `
    <div class="msg default-msg" data-identifier="message">
        <p><small>(${data.time})</small> <strong>${data.from}</strong> para <strong>${data.to}</strong>: ${data.text}</p>
    </div>
    `;
}

function createPrivateMessage(data) {
  return `
    <div class="msg private-msg" data-identifier="message">
        <p><small>(${data.time})</small> <strong>${data.from}</strong> reservadamente para <strong>${data.to}</strong>: ${data.text}</p>
    </div>
    `;
}

function createMessage(data) {
  if (data.type === "status") {
    return createStatusMessage(data);
  }

  if (data.type === "message") {
    return createDefaultMessage(data);
  }

  if (isVisible(data)) {
    return createPrivateMessage(data);
  }
  return "";
}

/*** creating sidebar ***/
function getImageHTML(contactName) {
  return messageObject.to === contactName
    ? VISIBLE_CHECKMARK
    : INVISIBLE_CHECKMARK;
}

function getContactHTML(logo, contactName) {
  const img = getImageHTML(contactName);
  return `
    <div class="contact" data-identifier="participant" onclick="changeContact(this)">
        <div class="contact-content">
            <ion-icon name="${logo}"></ion-icon>
            <p>${contactName}</p>
        </div>
        ${img}        
    </div>
    `;
}

/********************************************************** modifying the HTML *********************************************************/
function loadMessages(response) {
  const allData = response.data;

  const main = document.querySelector("main");
  main.innerHTML = "";

  for (const data of allData) {
    main.innerHTML += createMessage(data);
  }

  const lastMessage = main.querySelector(".msg:last-of-type");

  newLast = lastMessage.innerText;
  if (newLast !== oldLast) {
    lastMessage.scrollIntoView();
  }

  oldLast = newLast;
}

function startChat(response) {
  document.querySelector(".login-page").classList.add("hidden");
  postStatus();
  getMessages();
  getParticipants();
}

function addLoginErrorMessage(text) {
  const err = document.querySelector(".error");
  err.innerHTML = text;
}

function fillSidebar() {
  const contactsClass = document.querySelector(".contacts");
  const visible = document.querySelector(".contacts .visible");

  if (visible === null) {
    messageObject.to = "Todos";
  }

  contactsClass.innerHTML = getContactHTML("people", "Todos");

  if (participants !== null) {
    for (const participant of participants) {
      contactsClass.innerHTML += getContactHTML(
        "person-circle",
        participant.name
      );
    }
  }
}

/**************************************************** making GET requests to the API ***************************************************/
/*** fetching messages ***/
function getMessages() {
  const promise = axios.get(`${BASE_URL}/messages`);

  promise.then((response) => {
    loadMessages(response);
    timeoutMsgUpdate = setTimeout(getMessages, 3000);
  });
}

/*** fetching users ***/
function getParticipants() {
  const promise = axios.get(`${BASE_URL}/participants`);
  promise.then((response) => {
    participants = response.data;
    fillSidebar();
    setTimeout(getParticipants, 10000);
  });
}

/*************************************************** making POST requests to the API ***************************************************/
/*** keeping the connection ***/
function postStatus() {
  const promise = axios.post(`${BASE_URL}/status`, {
    name: messageObject.from
  });
  promise.then((response) => {
    setTimeout(postStatus, 5000);
  });
}

/*** sending a message ***/
function postMessage() {
  const input = document.querySelector(".msg-input");

  messageObject.text = input.value;

  const promise = axios.post(`${BASE_URL}/messages`, messageObject);
  promise.then((response) => {
    clearTimeout(timeoutMsgUpdate);
    getMessages();
  });

  promise.catch((error) => {
    window.location.reload();
  });

  input.value = "";
}

/*** logging in ***/
function postLogin() {
  const promise = axios.post(`${BASE_URL}/participants`, {
    name: messageObject.from
  });
  promise.then(startChat);

  promise.catch((error) => {
    addLoginErrorMessage("Usuário já existe!");
  });
}

/********************************************************* hide/show functions *********************************************************/
/*** sidebar ***/
function toggleSidebar() {
  document.querySelector("aside").classList.toggle("hidden");
}

function changeContact(contact) {
  changeChosen(contact, "contacts");
  messageObject.to = contact.querySelector("p").innerHTML;
}

function changeVisibility(visibility) {
  changeChosen(visibility, "visibilities");
  messageObject.type = isPrivate(visibility) ? "private_message" : "message";
  togglePrivateMsgDescription();
}

function changeChosen(object, className) {
  const visible = document.querySelector(`.${className} .visible`);
  if (visible !== null) {
    visible.classList.remove("visible");
  }
  object.querySelector("img").classList.add("visible");
}

/*** private messages ***/
function togglePrivateMsgDescription() {
  const privateMsg = document.querySelector(".private-msg-description");
  if (messageObject.type === "private_message") {
    if (privateMsg.classList.contains("hidden")) {
      privateMsg.classList.remove("hidden");
    }
    privateMsg.innerHTML = `
        Enviando para ${messageObject.to} (reservadamente)
        `;
  } else {
    privateMsg.classList.add("hidden");
  }
}

/********************************************************** boolean functions **********************************************************/
function isVisible(data) {
  return data.from === messageObject.from || data.to === messageObject.to;
}

function isPrivate(object) {
  return object.querySelector("p").innerHTML === "Reservadamente";
}

/******************************************************* miscellaneous functions *******************************************************/
function login() {
  const user = document.querySelector(".login-input");
  messageObject.from = user.value;

  if (messageObject.from === "") {
    addLoginErrorMessage("Usuário não pode estar vazio!");
  } else {
    postLogin();
  }

  user.value = "";
}

function setOnClickOnEnter(type) {
  const obj = document.querySelector(`.${type}-input`);
  obj.addEventListener("keyup", (event) => {
    event.preventDefault();
    if (event.keyCode === 13) {
      document.querySelector(`.${type}-btn`).click();
    }
  });
}

/*********************************************************** global variables **********************************************************/
const messageObject = {
  from: null,
  to: "Todos",
  text: null,
  type: "message"
};

let oldLast = null;
let newLast = null;
let participants;
let timeoutMsgUpdate;

/************************************************************ function calls ***********************************************************/
setOnClickOnEnter("login");
setOnClickOnEnter("msg");
