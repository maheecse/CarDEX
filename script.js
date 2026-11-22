const carGrid = document.getElementById("carGrid");
const searchInput = document.getElementById("searchInput");
const brandSelect = document.getElementById("brandSelect");
const yearSelect = document.getElementById("yearSelect");
const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");
const emptyMessage = document.getElementById("emptyMessage");
const resultCount = document.getElementById("resultCount");
const pageTitle = document.getElementById("pageTitle");
const allButton = document.getElementById("allButton");
const favoritesButton = document.getElementById("favoritesButton");
const favoriteCount = document.getElementById("favoriteCount");

const brandList = [
  "Toyota",
  "Honda",
  "BMW",
  "Mercedes-Benz",
  "Ford",
  "Tesla",
  "Audi",
  "Nissan",
  "Hyundai",
  "Kia",
];
const yearList = [
  2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015,
];

let allCars = [];
let favoriteCars = [];
let showOnlyFavorites = false;

function loadFavorites() {
  const savedText = localStorage.getItem("cardexFavorites");

  if (savedText !== null) {
    favoriteCars = JSON.parse(savedText);
  }
}

function isFavorite(carId) {
  const found = favoriteCars.find(function (car) {
    return car.id === carId;
  });

  return found !== undefined;
}

function toggleFavorite(car) {
  if (isFavorite(car.id)) {
    favoriteCars = favoriteCars.filter(function (item) {
      return item.id !== car.id;
    });
  } else {
    favoriteCars.push(car);
  }

  localStorage.setItem("cardexFavorites", JSON.stringify(favoriteCars));
  favoriteCount.textContent = favoriteCars.length;
  showCars();
}

function addOptions(select, list) {
  for (let i = 0; i < list.length; i++) {
    const option = document.createElement("option");
    option.value = list[i];
    option.textContent = list[i];
    select.appendChild(option);
  }
}

async function loadCars() {
  const url =
    "https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/" +
    encodeURIComponent(brandSelect.value) +
    "/modelyear/" +
    yearSelect.value +
    "?format=json";

  loadingMessage.classList.remove("hidden");
  errorMessage.classList.add("hidden");
  emptyMessage.classList.add("hidden");
  carGrid.innerHTML = "";
  resultCount.textContent = "";

  try {
    const response = await fetch(url);

    if (response.ok === false) {
      throw new Error("API error: " + response.status);
    }

    const data = await response.json();
    const uniqueModels = [];
    const usedNames = [];

    for (let i = 0; i < data.Results.length; i++) {
      const model = data.Results[i];

      if (usedNames.includes(model.Model_Name) === false) {
        usedNames.push(model.Model_Name);
        uniqueModels.push(model);
      }
    }

    allCars = uniqueModels.map(function (model) {
      return {
        id: model.Model_ID + "-" + yearSelect.value,
        name: model.Model_Name,
        brand: model.Make_Name,
        year: yearSelect.value,
        image: "",
        imageTried: false,
      };
    });
  } catch (error) {
    console.log(error);
    allCars = [];
    errorMessage.textContent =
      "Sorry, the cars could not be loaded. Check your internet and try again.";
    errorMessage.classList.remove("hidden");
  }

  loadingMessage.classList.add("hidden");
  showCars();
}

function makePlaceholder(car) {
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>" +
    "<rect width='600' height='400' fill='#2a2a2a'/>" +
    "<text x='300' y='210' font-size='36' fill='#999' text-anchor='middle' " +
    "font-family='Arial'>" +
    car.brand +
    " " +
    car.name +
    "</text></svg>";

  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

async function loadCarImage(car, imageElement) {
  car.imageTried = true;

  const url =
    "https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrlimit=5" +
    "&gsrsearch=" +
    encodeURIComponent(car.brand + " " + car.name + " car") +
    "&prop=pageimages&piprop=thumbnail&pithumbsize=600&format=json&origin=*";

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.query === undefined) {
      return;
    }

    for (const pageId in data.query.pages) {
      const page = data.query.pages[pageId];

      if (page.thumbnail !== undefined) {
        car.image = page.thumbnail.source;
        imageElement.src = car.image;
        return;
      }
    }
  } catch (error) {
    console.log(error);
  }
}

function showCars() {
  carGrid.innerHTML = "";

  const stillLoading = loadingMessage.classList.contains("hidden") === false;
  const hasError = errorMessage.classList.contains("hidden") === false;
  if (showOnlyFavorites === false && (stillLoading || hasError)) {
    return;
  }

  let carsToShow = allCars;
  if (showOnlyFavorites === true) {
    carsToShow = favoriteCars;
  }

  const searchText = searchInput.value.toLowerCase().trim();
  carsToShow = carsToShow.filter(function (car) {
    return (car.brand + " " + car.name).toLowerCase().includes(searchText);
  });

  resultCount.textContent = "Showing " + carsToShow.length + " car(s)";

  if (carsToShow.length === 0) {
    emptyMessage.textContent = "No cars found.";
    if (showOnlyFavorites === true && favoriteCars.length === 0) {
      emptyMessage.textContent = "You have no favorite cars yet.";
    }
    emptyMessage.classList.remove("hidden");
    return;
  }

  emptyMessage.classList.add("hidden");

  carsToShow.forEach(function (car) {
    carGrid.appendChild(createCarCard(car));
  });
}

function createCarCard(car) {
  const card = document.createElement("div");
  card.className = "car-card";

  let imageSource = makePlaceholder(car);
  if (car.image !== "") {
    imageSource = car.image;
  }

  let buttonText = "Add to Favorites";
  if (isFavorite(car.id)) {
    buttonText = "Remove from Favorites";
  }

  card.innerHTML =
    '<div class="card-image">' +
    '<img src="' +
    imageSource +
    '" alt="' +
    car.name +
    '">' +
    '<span class="year-badge">' +
    car.year +
    "</span>" +
    "</div>" +
    '<button class="favorite-button">&#9829;</button>' +
    '<div class="card-info">' +
    '<p class="card-brand">' +
    car.brand +
    "</p>" +
    "<h3>" +
    car.name +
    "</h3>" +
    '<button class="favorite-text-button">' +
    buttonText +
    "</button>" +
    "</div>";

  const image = card.querySelector("img");
  const heartButton = card.querySelector(".favorite-button");
  const textButton = card.querySelector(".favorite-text-button");

  if (isFavorite(car.id)) {
    heartButton.classList.add("is-favorite");
    textButton.classList.add("is-favorite");
  }

  image.addEventListener("error", function () {
    image.src = makePlaceholder(car);
  });

  heartButton.addEventListener("click", function () {
    toggleFavorite(car);
  });

  textButton.addEventListener("click", function () {
    toggleFavorite(car);
  });

  if (car.imageTried === false && car.image === "") {
    loadCarImage(car, image);
  }

  return card;
}

function changeView(favoritesOnly) {
  showOnlyFavorites = favoritesOnly;

  if (favoritesOnly === true) {
    pageTitle.textContent = "My Favorite Cars";
    favoritesButton.classList.add("active");
    allButton.classList.remove("active");
    loadingMessage.classList.add("hidden");
    errorMessage.classList.add("hidden");
  } else {
    pageTitle.textContent = "WELCOME TO CARDEX BY MAHEECSE";
    allButton.classList.add("active");
    favoritesButton.classList.remove("active");
  }

  if (favoritesOnly === false && allCars.length === 0) {
    loadCars();
  } else {
    showCars();
  }
}

searchInput.addEventListener("input", showCars);
brandSelect.addEventListener("change", loadCars);
yearSelect.addEventListener("change", loadCars);

allButton.addEventListener("click", function () {
  changeView(false);
});

favoritesButton.addEventListener("click", function () {
  changeView(true);
});

addOptions(brandSelect, brandList);
addOptions(yearSelect, yearList);
loadFavorites();
favoriteCount.textContent = favoriteCars.length;
loadCars();
