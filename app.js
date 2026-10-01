document
  .getElementById('loginButton')
  .addEventListener(
    'click',
    async function () {

      const email =
        document
          .getElementById('loginEmail')
          .value
          .trim();

      const password =
        document
          .getElementById('loginPassword')
          .value;


      if (!email || !password) {

        alert(
          'メールアドレスとパスワードを入力してください'
        );

        return;

      }


      const {
        data,
        error
      } =
        await supabaseClient.auth
          .signInWithPassword({
            email: email,
            password: password
          });


      if (error) {

        console.error(error);

        alert(
          'ログインできませんでした。\n' +
          error.message
        );

        return;

      }


      // あなたのUIDか確認
      if (
        !data.user ||
        data.user.id !== ADMIN_USER_ID
      ) {

        await supabaseClient.auth.signOut();

        setEditMode(false);

        alert(
          'このアカウントには編集権限がありません'
        );

        return;

      }


      setEditMode(true);

      alert(
        'ログインしました'
      );

    }
  );
