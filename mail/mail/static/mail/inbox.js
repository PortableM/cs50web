document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function show_email(email_id){
  
  // Show lone-email view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#lone-email-view').style.display = 'block';

  // clear previous content.
  document.querySelector('#lone-email-view').innerHTML = ''

  // mark email as read
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  });

  // fetch email by id.
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(result => {
      
      // Reply button
      const replyButton = document.createElement('button')
      replyButton.setAttribute('id', 'reply_button')
      replyButton.innerHTML = 'Reply'

      // email div.
      const emailDiv = document.createElement('div');
      emailDiv.setAttribute('id', 'solo_email')
      const fromEmail = `<div><b>From:</b> ${result.sender}</div>`;
      const toEmail = `<div><b>To</b>: ${result.recipients.join(', ')}</div>`;
      const subjectEmail = `<div><b>Subject:</b> ${result.subject}</div>`;
      const timestampEmail = `<div><b>Timestap:</b> ${result.timestamp}</div>`
      const bodyEmail = `<div id='email_body'><div>${result.body}</div></div>`
      emailDiv.innerHTML = `<div id='email_info'>${fromEmail}${toEmail}${subjectEmail}${timestampEmail}</div>`
      emailDiv.append(replyButton)
      emailDiv.innerHTML += bodyEmail

      // add div to DOM.
      document.querySelector('#lone-email-view').append(emailDiv)
      document.getElementById('email_body').style.cssText = 'font-size: 20px;'

      // click listener.
      document.getElementById('reply_button').addEventListener('click', () => {
        compose_email({sender: result.sender, subject: result.subject, body: result.body, datetime: result.timestamp})
      })


  });
}

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#lone-email-view').style.display = 'none';

  // Clear out composition fields.
  if(!arguments[0]){
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }
  // prefill composition form if arguments.
  else if(arguments[0]){
    
    // sender
    document.querySelector('#compose-recipients').value = arguments[0].sender;
    
    // subject
    if(arguments[0].subject.startsWith('Re: ')){
      composeSubject = arguments[0].subject
    }
    else{
      composeSubject = 'Re: ' + arguments[0].subject
    }
    document.querySelector('#compose-subject').value = composeSubject;
    
    // body
    composeBody = `On ${arguments[0].datetime} ${arguments[0].sender} wrote:\n`
    composeBody += arguments[0].body
    document.querySelector('#compose-body').value = composeBody;
  }

  // Post request on submitting form.
  document.querySelector('#compose-form').onsubmit = () => {
    const recipientsCompose = document.querySelector('#compose-recipients').value;
    const subjectCompose = document.querySelector('#compose-subject').value;
    const bodyCompose = document.querySelector('#compose-body').value;
    
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: `${recipientsCompose}`,
          subject: `${subjectCompose}`,
          body: `${bodyCompose}`
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
    });
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#lone-email-view').style.display = 'none';


  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3><div id='org_div1'></div>`;

  // Get mailbox.
  url = `emails/${mailbox}`
  fetch(url)
  .then(response => response.json())
  .then(result => {

    // Check if not empty
    if(result.length){
      result.forEach((element) => {

        // different mailfield for sent and inbox.
        if(mailbox == 'inbox'){
          mailField = element.sender;
        }
        else if(mailbox == 'sent') {
          mailField = element.recipients.join(', ');
        }; 

        // new div for each mail.
        const newDiv = document.createElement('div');
        newDiv.innerHTML = `<div>${mailField}</div><div>${element.subject}</div><div>${element.timestamp}</div>`;

        // archive button
        if(mailbox=='inbox'){
          const archiveButton = document.createElement('button');
          archiveButton.setAttribute('id', 'archive_button');
          archiveButton.setAttribute('data-emailid', `${element.id}`);
          archiveButton.innerHTML = 'Archive';
          archiveButton.addEventListener('click', (e) => {
            // set archived to True
            fetch(`/emails/${element.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: true})
              })
            .then(response => {
              e.stopPropagation();
              load_mailbox('inbox');
              });
            });
            //apppend archive button
            newDiv.append(archiveButton);
            newDiv.style.gridTemplateColumns = '0.5fr 1.5fr 0.5fr 0.5fr';
          }

        // unarchive button
        else if(mailbox == 'archive'){
          const unarchiveButton = document.createElement('button')
          unarchiveButton.setAttribute('id', 'unarchive_button')
          unarchiveButton.setAttribute('data-emailid', `${element.id}`)
          unarchiveButton.innerHTML = 'Unarchive'
          unarchiveButton.addEventListener('click', (e) => {
            // set archived to True
            fetch(`/emails/${element.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: false})
              })
            .then(response => {
              e.stopPropagation();
              load_mailbox('inbox');
              })
            });
            //apppend unarchive button
            newDiv.append(unarchiveButton);
            newDiv.style.gridTemplateColumns = '0.5fr 1.5fr 0.5fr 0.5fr'
          };

        // bg_color for read/unread.
        if(!element.read){
          newDiv.style.background = 'white'
        }
        else{
          newDiv.style.background = 'gray'
        };
        
        // add listener on clicking.
        newDiv.addEventListener('click', function() {
          show_email(element.id)
      });

        // insert email div.
        orgdiv1 = document.getElementById('org_div1');
        orgdiv1.insertBefore(newDiv, null);

      })
    }
    else{
      console.log('mty result')
    }
  });
}