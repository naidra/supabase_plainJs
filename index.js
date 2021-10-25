(async function() {
  var SUPABASE_URL = 'https://eripmpddthomekbchguw.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNjk2NTcwNCwiZXhwIjoxOTQyNTQxNzA0fQ.mgx8LmPMwo3FDAp8tml8RXpDCAPO__rWfQJgMDHExPQ';
  
  var supabase_place = await supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  window.userToken = null;
  
  const signUpSubmitted = async (form, event) => {
    event.preventDefault();
    const email = event.target[0].value;
    const password = event.target[1].value;
  
    const response = await supabase_place.auth.signUp({ email, password });
    response.error ? alert(response.error.message) : setToken(response);
    form.reset();
  };
  
  const logInSubmitted = async (form, event) => {
    event.preventDefault();
    const email = event.target[0].value;
    const password = event.target[1].value;
    const response = await supabase_place.auth.signIn({ email, password });
    response.error
      ? alert(response.error.message)
      : (setToken(response) || updateDisplay());
      form.reset();
  };
  
  const fetchUserDetails = () => {
    alert(JSON.stringify(supabase_place.auth.user()));
  };
  
  const logoutSubmitted = async (event) => {
    event.preventDefault();
    await supabase_place.auth.signOut();
    updateDisplay();
  };
  
  const setToken = (response) => {
    if (response.data.confirmation_sent_at && !response.data.access_token) {
      alert('Confirmation Email Sent');
    } else {
      // document.querySelector('#access-token').value = response.data.access_token;
      // document.querySelector('#refresh-token').value = response.data.refresh_token;
      alert('Logged in as ' + response.user.email);
    }
  }

  const addNewDataFunction = async (form, event) => {
    event.preventDefault();
    const name = event.target[1].value.toUpperCase();
    const points = event.target[2].value;
    const in_office = event.target[3].checked;
    let { data: one_data, error: one_error } = await supabase_place.from("agents_list").select("*").eq("name", name).single();
    
    if(one_data) { // Update
      await supabase_place.from("agents_list").update({ points, in_office }).match({ name: name });
    } else { // Insert
      await supabase_place
        .from("agents_list")
        .insert({ name, points, in_office })
        .single();
    }
    form.reset();
    Array.from(document.querySelectorAll('.close')).forEach(btn => btn.click());
    updateDisplay();
  };

  function showModalForUpdate(id, name, points, in_office) {
    edit_data_modal_btn.click();
    edit_data_form.elements[1].value = id;
    edit_data_form.elements[2].value = name;
    edit_data_form.elements[3].value = points;
    edit_data_form.elements[4].checked = in_office;
  }
  window.showModalForUpdate = showModalForUpdate;

  const editNewDataFunction = async (form, event) => {
    event.preventDefault();
    const id = event.target[1].value;
    const name = event.target[2].value.toUpperCase();
    const points = event.target[3].value;
    const in_office = event.target[4].checked;
    let { data: one_data, error: one_error } = await supabase_place.from("agents_list").select("*").eq("id", id).single();
    
    if(one_data) { // Update
      await supabase_place.from("agents_list").update({ name, points, in_office }).match({ id });
    }
    
    form.reset();
    Array.from(document.querySelectorAll('.close')).forEach(btn => btn.click());
    updateDisplay();
  };
  
  const deleteItem = async id => {
    if(confirm('A doni ta fshini?')){
      const { data, error } = await supabase_place
      .from('agents_list').delete().match({ id });
      
      updateDisplay();
    }
  };
  window.deleteItem = deleteItem;

  const build_list_of_employees = (list) => {
    const html = list.map(({id, name, points, in_office }) => (`
      <tr>
        <td>${name}</td>
        <td>${points}</td>
        <td>${in_office}</td>
        <td>
          <div class="d-flex justify-content-end">
            <button class="btn btn-primary btn-sm me-2" onclick="showModalForUpdate(${id}, '${name}', '${points}', ${in_office})">🖊</button>
            <button class="btn btn-danger btn-sm" onclick="deleteItem(${id})">×</button>
          </div>
        </td>
      </tr>
    `)).join('');
    return html;
  }

  const updateDisplay = async () => {
    if(supabase_place.auth.localStorage.length) { // user is logged in
      // const userData = JSON.parse(supabase_place.auth.localStorage['supabase.auth.token']);
      document.querySelector('.logged-in-content').classList.add('d-block');
      document.querySelector('.logged-in-content').classList.remove('d-none');
      document.querySelector('.logged-out-content').classList.add('d-none');
      document.querySelector('.logged-out-content').classList.remove('d-block');
      let { data, error } = await supabase_place
          .from("agents_list")
          .select("*")
          .order("id", { ascending: false });
      if (error) console.log("error", error);
      console.log(data);
      dynamic_content.innerHTML = build_list_of_employees(data);
    } else { // user is not logged in
      document.querySelector('.logged-in-content').classList.add('d-none');
      document.querySelector('.logged-in-content').classList.remove('d-block');
      document.querySelector('.logged-out-content').classList.add('d-block');
      document.querySelector('.logged-out-content').classList.remove('d-none');
      dynamic_content.innerHTML = build_list_of_employees([]);
    }
  }
  
  document.addEventListener('DOMContentLoaded', async function (event) {
    var signUpForm = document.querySelector('#sign-up');
    signUpForm.onsubmit = signUpSubmitted.bind(null, signUpForm);
  
    var logInForm = document.querySelector('#log-in');
    logInForm.onsubmit = logInSubmitted.bind(null, logInForm);
    
    add_data_form.onsubmit = addNewDataFunction.bind(null, add_data_form);
    edit_data_form.onsubmit = editNewDataFunction.bind(null, edit_data_form);
  
    // var userDetailsButton = document.querySelector('#user-button');
    // userDetailsButton.onclick = fetchUserDetails.bind(userDetailsButton);
  
    var logoutButton = document.querySelector('#logout-button');
    logoutButton.onclick = logoutSubmitted.bind(logoutButton);
  
    updateDisplay();

    const wsSupabase = await supabase_place
      .from('agents_list')
      .on("*", (data) => console.log('Data: ', data))
      .subscribe((od) => {
        console.log(`data: ${od}`);
      });

    // window.wsSupabase = wsSupabase;

    // wsSupabase.socket.conn.onopen = e => {
    //   wsSupabase.socket.conn.onmessage = ({ data }) => {
    //     console.log('data: ', JSON.parse(data));
    //   };
    // };
  });
})();