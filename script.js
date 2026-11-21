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

function makePlaceholder(car) {
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>" +
    "<rect width='600' height='400' fill='#25252d'/>" +
    "<text x='300' y='180' font-size='34' fill='#ff4d2e' " +
    "text-anchor='middle' font-family='Arial'>" +
    car.brand +
    "</text>" +
    "<text x='300' y='230' font-size='28' fill='#f2f2f2' " +
    "text-anchor='middle' font-family='Arial'>" +
    car.name +
    "</text></svg>";

  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function loadFavorites() {
  const savedText = localStorage.getItem("cardexFavorites");

  if (savedText !== null) {
    favoriteCars = JSON.parse(savedText);
  } else {
    favoriteCars = [];
  }
}

function saveFavorites() {
  const textToSave = JSON.stringify(favoriteCars);
  localStorage.setItem("cardexFavorites", textToSave);
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

  saveFavorites();
  updateFavoriteCount();
  showCars();
}

function updateFavoriteCount() {
  favoriteCount.textContent = favoriteCars.length;
}

function fillDropdowns() {
  for (let i = 0; i < brandList.length; i++) {
    const option = document.createElement("option");
    option.value = brandList[i];
    option.textContent = brandList[i];
    brandSelect.appendChild(option);
  }

  for (let i = 0; i < yearList.length; i++) {
    const option = document.createElement("option");
    option.value = yearList[i];
    option.textContent = yearList[i];
    yearSelect.appendChild(option);
  }
}

async function loadCars() {
  const brand = brandSelect.value;
  const year = yearSelect.value;

  const url =
    "https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/" +
    encodeURIComponent(brand) +
    "/modelyear/" +
    year +
    "?format=json";

  loadingMessage.classList.remove("hidden");
  errorMessage.classList.add("hidden");
  emptyMessage.classList.add("hidden");
  carGrid.innerHTML = "";
  resultCount.textContent = "";

  try {
    const response = await fetch(url);

    if (response.ok === false) {
      throw new Error("The API answered with an error: " + response.status);
    }

    const data = await response.json();

    const modelList = data.Results;

    const uniqueModels = [];
    const usedNames = [];

    for (let i = 0; i < modelList.length; i++) {
      const modelName = modelList[i].Model_Name;

      if (usedNames.includes(modelName) === false) {
        usedNames.push(modelName);
        uniqueModels.push(modelList[i]);
      }
    }

    allCars = uniqueModels.map(function (model) {
      return makeCar(model, year);
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

function makeCar(model, year) {
  const car = {
    id: model.Model_ID + "-" + year,
    name: model.Model_Name,
    brand: model.Make_Name,
    year: year,
    image: "",
    imageTried: false,
  };

  return car;
}

async function loadCarImage(car, imageElement) {
  car.imageTried = true;

  const searchText = car.brand + " " + car.name + " car";

  const url =
    "https://en.wikipedia.org/w/api.php?action=query" +
    "&generator=search&gsrlimit=5" +
    "&gsrsearch=" +
    encodeURIComponent(searchText) +
    "&prop=pageimages&piprop=thumbnail&pithumbsize=600" +
    "&format=json&origin=*";

  try {
    const response = await fetch(url);

    if (response.ok === false) {
      throw new Error("Wikipedia error: " + response.status);
    }

    const data = await response.json();

    if (data.query === undefined) {
      console.log("No Wikipedia result for: " + searchText);
      return;
    }

    const pages = data.query.pages;

    for (const pageId in pages) {
      const page = pages[pageId];

      if (page.thumbnail !== undefined) {
        car.image = page.thumbnail.source;
        imageElement.src = car.image;
        return;
      }
    }

    console.log("No picture found for: " + searchText);
  } catch (error) {
    console.log(error);
  }
}

function getFilteredCars() {
  const searchText = searchInput.value.toLowerCase().trim();

  let result = allCars;
  if (showOnlyFavorites === true) {
    result = favoriteCars;
  }

  if (searchText !== "") {
    result = result.filter(function (car) {
      const fullName = (car.brand + " " + car.name).toLowerCase();
      return fullName.includes(searchText);
    });
  }

  return result;
}

function showCars() {
  const carsToShow = getFilteredCars();

  carGrid.innerHTML = "";

  const isLoading = loadingMessage.classList.contains("hidden") === false;
  const hasError = errorMessage.classList.contains("hidden") === false;
  if (
    showOnlyFavorites === false &&
    (isLoading === true || hasError === true)
  ) {
    resultCount.textContent = "";
    return;
  }

  resultCount.textContent = "Showing " + carsToShow.length + " car(s)";

  if (carsToShow.length === 0) {
    if (showOnlyFavorites === true && favoriteCars.length === 0) {
      emptyMessage.textContent =
        "You have no favorite cars yet. Click the heart on a car to add it.";
    } else {
      emptyMessage.textContent = "No cars found. Try a different search.";
    }
    emptyMessage.classList.remove("hidden");
    return;
  }

  emptyMessage.classList.add("hidden");

  carsToShow.forEach(function (car) {
    const card = createCarCard(car);
    carGrid.appendChild(card);
  });
}

function createCarCard(car) {
  const card = document.createElement("div");
  card.className = "car-card";

  let imageSource = makePlaceholder(car);
  if (car.image !== "") {
    imageSource = car.image;
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
    '<div class="card-info">' +
    '<p class="card-brand">' +
    car.brand +
    "</p>" +
    "<h3>" +
    car.name +
    "</h3>" +
    "</div>";

  const image = card.querySelector("img");
  image.addEventListener("error", function () {
    image.src = makePlaceholder(car);
  });

  if (car.imageTried === false && car.image === "") {
    loadCarImage(car, image);
  }

  const heartButton = document.createElement("button");
  heartButton.className = "favorite-button";
  heartButton.textContent = "\u2665";

  if (isFavorite(car.id)) {
    heartButton.classList.add("is-favorite");
  }

  heartButton.addEventListener("click", function (event) {
    event.stopPropagation();
    toggleFavorite(car);
  });

  card.appendChild(heartButton);

  const textButton = document.createElement("button");
  textButton.className = "favorite-text-button";

  if (isFavorite(car.id)) {
    textButton.textContent = "Remove from Favorites";
    textButton.classList.add("is-favorite");
  } else {
    textButton.textContent = "Add to Favorites";
  }

  textButton.addEventListener("click", function () {
    toggleFavorite(car);
  });

  const cardInfo = card.querySelector(".card-info");
  cardInfo.appendChild(textButton);

  return card;
}

function showAllView() {
  showOnlyFavorites = false;
  pageTitle.textContent = "Browse Cars by Brand and Year";
  allButton.classList.add("active");
  favoritesButton.classList.remove("active");

  if (allCars.length === 0) {
    loadCars();
  } else {
    showCars();
  }
}

function showFavoritesView() {
  showOnlyFavorites = true;
  pageTitle.textContent = "My Favorite Cars";
  favoritesButton.classList.add("active");
  allButton.classList.remove("active");

  loadingMessage.classList.add("hidden");
  errorMessage.classList.add("hidden");
  showCars();
}

searchInput.addEventListener("input", showCars);

brandSelect.addEventListener("change", loadCars);
yearSelect.addEventListener("change", loadCars);

allButton.addEventListener("click", showAllView);
favoritesButton.addEventListener("click", showFavoritesView);

fillDropdowns();
loadFavorites();
updateFavoriteCount();
loadCars();
