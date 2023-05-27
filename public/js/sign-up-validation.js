$(() => {

  // Username: no spaces, 2 to 16 chars

  $("#floatingUsername").on("input", () => {
    $("#floatingUsername").val($("#floatingUsername").val().replace(/\s/g, ""));
  });

  $("#floatingUsername").on("keyup", () => {
    const usernameValue = $("#floatingUsername").val();
    if (usernameValue.length >= 2 && usernameValue.length <= 16) {
      $(".username-length").addClass("valid");
    } else {
      $(".username-length").removeClass("valid");
    }
  });


  // Nickname: between 2 to 10 chars

  $("#floatingNickname").on("keyup", () => {
    const nicknameValue = $("#floatingNickname").val();
    if (nicknameValue.length >= 2 && nicknameValue.length <= 10) {
      $(".nickname-length").addClass("valid");
    } else {
      $(".nickname-length").removeClass("valid");
    }
  });


  // Password: no spaces, at least 8 chars, at least 1 letter & 1 number

  $("#floatingPassword").on("input", () => {
    $("#floatingPassword").val($("#floatingPassword").val().replace(/\s/g, ""));
  });

  $("#floatingPassword").on("keyup", () => {
    const passwordValue = $("#floatingPassword").val();
    if (passwordValue.length >= 8) {
      $(".password-length").addClass("valid");
    } else {
      $(".password-length").removeClass("valid");
    }
    const hasLetter = /[A-z]+/.test(passwordValue);
    if (hasLetter) {
      $(".password-letter").addClass("valid");
    } else {
      $(".password-letter").removeClass("valid");
    }
    const hasNumber = /\d+/.test(passwordValue);
    if (hasNumber) {
      $(".password-number").addClass("valid");
    } else {
      $(".password-number").removeClass("valid");
    }
  });

  // Sign up button

  $(".user-input").on("keyup", () => {
    if ($(".requirement").not(".valid").length) {
      $(".sign-up-btn").prop("disabled", true);
    } else {
      $(".sign-up-btn").prop("disabled", false);
    }
  });
  
});
