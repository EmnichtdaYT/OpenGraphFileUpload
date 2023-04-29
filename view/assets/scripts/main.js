$(document).ready(() => {
  if (getCookie("token") && getCookie("user")) {
    const tokenCheck = new XMLHttpRequest();

    tokenCheck.onreadystatechange = () => {
      if (tokenCheck.readyState !== 4) {
        return;
      }

      if (tokenCheck.status === 200) {
        return;
      }

      console.log(tokenCheck.responseText);

      logout();
    };

    tokenCheck.open("POST", "/token", true);
    tokenCheck.setRequestHeader("Content-type", "application/json");
    tokenCheck.send(JSON.stringify({ username: getCookie("user"), token: getCookie("token") }));
  }
});
