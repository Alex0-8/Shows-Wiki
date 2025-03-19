const loading = document.getElementById("loading");

// crea los elemoentos de la tarjeta del show
const createShowCard = (show) => {
    const card = document.createElement("div");
    card.classList.add("show-card");

    //---Sección del contenedor de la imagen de la serie---\\
    const imageContainer = document.createElement("div");
    imageContainer.classList.add("show-image-container");

    const image = document.createElement("img");
    image.classList.add("show-image");
    image.src = show.image ? show.image.medium : "https://via.placeholder.com/210x295";
    image.alt = show.name;

    imageContainer.appendChild(image);
    card.appendChild(imageContainer);

    //---Sección de la información---\\
    const infoDiv = document.createElement("div");
    infoDiv.classList.add("show-info");

    //---Nombre de la serie---\\
    const name = document.createElement("h2");
    name.classList.add("show-name");
    name.textContent = show.name;

    //---Sección de géneros---\\
    const genresDiv = document.createElement("div");
    genresDiv.classList.add("show-genres");

    show.genres.forEach((genre) => {
        const genreSpan = document.createElement("span");
        genreSpan.classList.add("show-genre");
        genreSpan.textContent = genre;
        genresDiv.appendChild(genreSpan);
    });

    infoDiv.appendChild(name);
    infoDiv.appendChild(genresDiv);

    //---Enlace a detalles---\\
    const detailsLink = document.createElement("a");
    detailsLink.href = `details.html?id=${show.id}`;
    detailsLink.textContent = "See details";
    detailsLink.classList.add("show-details-link");

    infoDiv.appendChild(detailsLink);
    card.appendChild(infoDiv);

    return card;
};

//----carga los shows en el grid del index---\\
const loadShows = async () => {
    const showGrid = document.getElementById("show-grid");

    if(!showGrid) return;

    try {
        const response = await axios.get("https://api.tvmaze.com/shows?page=1");
        const shows = response.data.slice(0, 42); // Obtener 42 programas

        // Limpia los programas antes de agregar más
        showGrid.innerHTML = " ";
        shows.forEach((show) => {
            const showCard = createShowCard(show);
            showGrid.appendChild(showCard);
        });

    } catch (error) {
        console.log("Error al obtener las series: ", error);
    } finally { // quita el gif de carga
        loading.style.display = "none";
    }
};

document.addEventListener("DOMContentLoaded", loadShows);

//-------seccion del buscador------\\
const showSearcher = async () => {
    const showName = document.getElementById("show-search").value.trim().toLowerCase();
    if (showName) {
        try {
            // Mostrar el gif de carga antes de la solicitud
            loading.style.display = "unset";
            const response = await axios.get(`https://api.tvmaze.com/search/shows?q=${showName}`);
            console.log(response);
            const showGrid = document.getElementById("show-grid");
            showGrid.innerHTML = ""; // Limpiar los resultados anteriores
            
            const shows = response.data.map(item => item.show);
            shows.forEach(show => {
                const showCard = createShowCard(show);
                showGrid.appendChild(showCard);
            });

            if(shows.length === 1){ // si en el resultado de busqueda solo sale 1 resultado ajusta sus estilos
                const singleCard = document.querySelector(".show-card");
                singleCard.style.width = "35%";
                
                showGrid.style.justifyItems = "center";
            }
        } catch (error) {
            console.log("ocurrio un error: ", error);
        } finally {
            loading.style.display = "none";
        }
    }
}

//se le agrega funcionalidad a la seccion del buscador si está en el index
const searchButton = document.getElementById("search-button");

if(searchButton){
    searchButton.addEventListener("click", showSearcher);    
    document.getElementById("show-search").addEventListener("keypress", function (e) {
        if(e.key === "Enter"){
            showSearcher();
        }
    })
}




//--------seccion de detalles------\\
const loadShowInfo = async () => {
    const params = new URLSearchParams(window.location.search);
    const showId = params.get("id");
    const showDetails = document.getElementById("show-details");

    if(!showDetails) return; // si no se encuentra en la pagina de detalles no mostrara errores en la consola
    
    if (!showId) {
        showDetails.innerHTML = "<p>Error: No se encontró la serie.</p>";
        return;
    }
    
    try {
        // Obtener detalles de la serie
        const response = await axios.get(`https://api.tvmaze.com/shows/${showId}`);
        const show = response.data;

        //se crea la estructura de la pagina
        showDetails.innerHTML = `
            <section class="show-img">
            <h2>${show.name}</h2>
            <img src="${show.image ? show.image.original : 'https://via.placeholder.com/300x450'}" alt="${show.name}">
            </section>
            <section class="show-info">
            <p><strong>Géneros:</strong> ${show.genres.join(', ')}</p>
            <p><strong>Reales date:</strong> ${show.premiered || 'Desconocida'}</p>
            <p><strong>Score:</strong> ${show.rating.average || 'No disponible'}</p>
            <p><strong>Resume:</strong> ${show.summary}</p>
            </section>
        `;

        // Obtener episodios
        const episodesResponse = await axios.get(`https://api.tvmaze.com/shows/${showId}/episodes`);
        const episodes = episodesResponse.data;

        // Agrupar episodios por temporada
        const seasons = {};
        episodes.forEach(ep => {
            if (!seasons[ep.season]) {
                seasons[ep.season] = [];
            }
            seasons[ep.season].push(ep);
        });

        // agrupa los episodios por temporadas
        const episodesContainer = document.getElementById("episodes-container");
        const episodeSeccion = document.getElementById("episodes-seccion");
        episodeSeccion.insertAdjacentHTML("afterbegin", "<h3>Episodes:</h3>");
        for (const season in seasons) {
            const seasonDiv = document.createElement("div");
            seasonDiv.classList.add("season");

            const seasonTitle = document.createElement("h4");
            seasonTitle.textContent = `Season ${season}`;

            seasonTitle.addEventListener("click", () => {
                const episodeList = seasonTitle.nextElementSibling;
                episodeList.classList.toggle("episodes-show");
            })
            seasonDiv.appendChild(seasonTitle);

            const episodeList = document.createElement("ul");
            episodeList.classList.add("episodes")
            seasons[season].forEach(ep => {
                const li = document.createElement("li");
                li.textContent = `E${ep.number} - ${ep.name}`;
                episodeList.appendChild(li);
            });

            seasonDiv.appendChild(episodeList);
            episodesContainer.appendChild(seasonDiv);
        }

    } catch (error) {
        console.error("Error al obtener los detalles de la serie", error);
        showDetails.innerHTML = "<p>Error al cargar la información.</p>";
    } finally {
        loading.style.display = "none";
    }
};

document.addEventListener("DOMContentLoaded", loadShowInfo);