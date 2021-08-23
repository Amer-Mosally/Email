document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  //
  document.querySelector('#compose-form').onsubmit = () => {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
      if ("message" in result) {
        load_mailbox('sent');
      }
      else if("error" in result) {
        console.log(result);
        alert(JSON.stringify(result));  // to display the error on the page
      }
    })
    return false;
  }
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3> ${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {

      if (mailbox == "inbox") {
        if (email.read ) 
          flag = "header";
        else 
          flag = "body";
      }else{
        flag = "body";
      }

      if (mailbox == "sent"){
        user = email.recipients;
        x = "To";
      }else{ 
        user = email.sender;
        x = "Form";
      }
      
      const element = document.createElement("div");
      element.innerHTML = 
      `<div class="card-${flag} border border-info rounded" id="element-${email.id}">
      ${x}: ${user}
      <br>
      ${email.timestamp}
      <br>
      Title: ${email.subject}
      </div>`;
      document.querySelector("#emails-view").append(element);
      element.addEventListener("click", () => {
        email_details(email.id, mailbox);
      });
    });
  });
}

function email_details(id, mailbox){
  fetch(`/emails/${id}`)
  .then((response) => response.json())
  .then((email) => {
    unread(id);
    document.querySelector("#emails-view").innerHTML = "";
    const element = document.createElement("div");
    element.innerHTML = `<div class="card-header" rounded white-space: pre-line;">
      From: ${email.sender}
      <br>
      To: ${email.recipients}
      <br>
      Date: ${email.timestamp}
      <br>
      Subject: ${email.subject}
    </div>
    <div class="card-body" white-space: pre-line;">
      ${email.body}
    </div>`;
    document.querySelector("#emails-view").append(element);

  //archive
    const archive_btn = document.createElement("btn");
    archive_btn.className = `btn btn-secondary `;

    if (email.archived) 
      archive_btn.innerHTML = "Unarchive"; 
    else 
      archive_btn.textContent = "Archive";

    archive_btn.addEventListener("click", () => {
      archiving(id, email.archived);
    });
    if (mailbox != "sent")
    document.querySelector("#emails-view").append(archive_btn);
    //reply
    const reply_btn = document.createElement("btn");
    reply_btn.className = `btn btn-link`;
    reply_btn.textContent = "Reply";
    reply_btn.addEventListener("click", () => {
      reply(email.sender, email.subject, email.body, email.timestamp);
    });
    document.querySelector("#emails-view").append(reply_btn);
  });
}


function unread(id) {
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true
    })
  })
}
function archiving(id, archived) {
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: !archived
    })
  })
}
function reply(recipient, subject, body, timestamp) {
  compose_email();
  document.querySelector("#compose-recipients").value = recipient;
  document.querySelector("#compose-subject").value = 'Re: '+subject;
  document.querySelector("#compose-body").value = 'On ('+timestamp+') '+recipient+' wrote:\n\n'+body;
}