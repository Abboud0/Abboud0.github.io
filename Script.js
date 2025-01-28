let currentIndex = 0;
const items = document.querySelectorAll(".carousel__item");
const totalItems = items.length;

// Function to update the position of the cards
function updateCarousel() {
    items.forEach((item, index) => {
        item.classList.remove("active", "prev", "next", "hidden");
    });

    // Add Active Class
    items[currentIndex].classList.add("active");

    // Set previous & next items
    let prevIndex = (currentIndex - 1 + totalItems) % totalItems;
    let nextIndex = (currentIndex + 1) % totalItems;

    items[prevIndex].classList.add("prev");
    items[nextIndex].classList.add("next");

    // Hide all other items
    items.forEach((item, index) => {
        if (index !== currentIndex && index !== prevIndex && index !== nextIndex) {
            item.classList.add("hidden");
        }
    });
}

// Function for next slide
function nextSlide() {
    currentIndex = (currentIndex + 1) % totalItems;
    updateCarousel();
}

// Function for previous slide
function prevSlide() {
    currentIndex = (currentIndex - 1 + totalItems) % totalItems;
    updateCarousel();
}

// Add event listeners to buttons
document.querySelector(".next").addEventListener("click", nextSlide);
document.querySelector(".prev").addEventListener("click", prevSlide);

// Initialize the carousel
updateCarousel();
