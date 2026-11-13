const logoutButton = document.getElementById("logout-button");
const logoutPopup = document.getElementById("logout-popup");
const cancelLogout = document.getElementById("cancel-logout");
const confirmLogout = document.getElementById("confirm-logout");

if (logoutButton && logoutPopup && cancelLogout && confirmLogout) {
  logoutButton.addEventListener("click", () => {
    logoutPopup.style.display = "flex";
  });

  cancelLogout.addEventListener("click", () => {
    logoutPopup.style.display = "none";
  });

  confirmLogout.addEventListener("click", () => {
    localStorage.removeItem("token");
    location.href = "/";
  });

  logoutPopup.addEventListener("click", (event) => {
    if (event.target === logoutPopup) {
      logoutPopup.style.display = "none";
    }
  });
}
