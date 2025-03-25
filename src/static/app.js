document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = ""; // Clear existing options

      // Add "Select activity" option
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "-- Select an activity --";
      activitySelect.appendChild(defaultOption);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span id="spots-left-${name}">${spotsLeft}</span> spots left</p>
          <p><strong>Participants:</strong></p>
          <ul id="participants-${name}">
            ${details.participants.map(participant => `<li>${participant}</li>`).join('')}
          </ul>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown if spots are available
        if (spotsLeft > 0) {
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          activitySelect.appendChild(option);
        }
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Function to update participants list and spots left
  function updateParticipantsList(activity, email) {
    const participantsList = document.getElementById(`participants-${activity}`);
    const newParticipant = document.createElement("li");
    newParticipant.textContent = email;
    participantsList.appendChild(newParticipant);

    // Update spots left
    const spotsLeftElement = document.getElementById(`spots-left-${activity}`);
    let spotsLeft = parseInt(spotsLeftElement.textContent, 10) - 1;
    if (spotsLeft <= 0) {
      spotsLeft = "None left";
      // Remove activity from dropdown
      const optionToRemove = Array.from(activitySelect.options).find(option => option.value === activity);
      if (optionToRemove) {
        activitySelect.removeChild(optionToRemove);
      }
    }
    spotsLeftElement.textContent = spotsLeft;
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      // Check availability before proceeding
      const spotsLeftElement = document.getElementById(`spots-left-${activity}`);
      let spotsLeft = parseInt(spotsLeftElement.textContent, 10);
      if (spotsLeft <= 0) {
        messageDiv.textContent = "No spots left for this activity.";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        return;
      }

      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        updateParticipantsList(activity, email); // Update participants list and spots left
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});