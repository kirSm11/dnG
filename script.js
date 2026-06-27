function openPage(page) {


    const app = document.getElementById("app");


    if(page === "budget") {

        app.innerHTML = `
        <h1>Бюджет</h1>
        <p>Управление деньгами</p>
        `;

    }


    if(page === "stats") {

        app.innerHTML = `
        <h1>Статистика</h1>
        <p>Графики и анализ</p>
        `;

    }


    if(page === "history") {

        app.innerHTML = `
        <h1>История</h1>
        <p>Список операций</p>
        `;

    }


    if(page === "settings") {

        app.innerHTML = `
        <h1>Настройки</h1>
        <p>Параметры приложения</p>
        `;

    }

}