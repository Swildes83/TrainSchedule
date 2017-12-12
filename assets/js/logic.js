// Initialize Firebase
var config = {
  apiKey: "AIzaSyBcuLPVBqcFxHQX0ugTvtlkbaa-eGIanyI",
  authDomain: "train-schedule-22962.firebaseapp.com",
  databaseURL: "https://train-schedule-22962.firebaseio.com",
  projectId: "train-schedule-22962",
  storageBucket: "train-schedule-22962.appspot.com",
  messagingSenderId: "14296387058"
};
firebase.initializeApp(config);
var database = firebase.database();


// Initialize Data as a Global Variable
var data;


// Firebase change found - Pull New Data as soon as a database changes
database.ref().on("value", function (snapshot) {

  // Collect updated Firebase Data
  data = snapshot.val();

  // Update HTML Table 
  refreshTable();

});

// Submit Button- Collects values and Updates Firebase
$("#addTrainButton").on('click', function () {

  // Values from the HTML Form
  var trainName = $("#nameInput").val().trim();
  var trainDestination = $("#destinationInput").val().trim();
  var trainFirstArrivalTime = $("#firstArrivalInput").val().trim();
  var trainFreq = $("#frequencyInput").val().trim();


  // Edit the First Arrival Time to include the date of new data submission (for use in moment.js)
  // Collect the date upon user click
  var today = new Date();
  var thisMonth = today.getMonth() + 1;
  var thisDate = today.getDate();
  var thisYear = today.getFullYear();

  // Create a String from the Date 
  var dateString = "";
  var dateString = dateString.concat(thisMonth, "/", thisDate, "/", thisYear);

  // Create a Date and Time String for Storage
  var trainFirstArrival = dateString.concat(" ", trainFirstArrivalTime);


  // Push new data to FireBase
  database.ref().push({
    name: trainName,
    destination: trainDestination,
    firstArrival: trainFirstArrival,
    frequency: trainFreq
  });


  // Clear input fields after submission
  $("#nameInput").val("");
  $("#destinationInput").val("");
  $("#firstArrivalInput").val("");
  $("#frequencyInput").val("");


  // Prevent Default Refresh of Submit Button
  return false;
});

// Function to Update the HTML Table on the DOM
function refreshTable() {

  // Clear old data 
  $('.table-body-row').empty();

  // Initialize objects array 
  var arrayOfObjects = [];

  // Initialize Array of Minutes Left to Departure (for use in appending trains in order of departure for the HTML Table)
  var arrayOfTimes = [];

  // Parse the Firebase Data and then append to HTML table
  $.each(data, function (key, value) {


    // Collect variable 
    var trainName = value.name;
    var trainDestination = value.destination;
    var trainFreq = value.frequency;

    var trainFirstArrivalTime = value.firstArrival;


    // Initialize variables 
    var trainNextDeparture;
    var trainMinutesAway;


    // Moment.js 
    var convertedDate = moment(new Date(trainFirstArrivalTime));

    // Calculate Minutes Away
    // Find How Many Minutes Ago the very First Train Departed
    var minuteDiffFirstArrivalToNow = moment(convertedDate).diff(moment(), "minutes") * (-1);

    // --------------- Sanity Check for New Train Times ---------------
    // Negative Value - If the Train never arrived yet (first arrival date is later than now)
    if (minuteDiffFirstArrivalToNow <= 0) {

      // Train Departure = Current Time - First Arrival Time
      trainMinutesAway = moment(convertedDate).diff(moment(), "minutes");

      // Next Depature Time = First Departure Time (since the train has yet to come)
      trainNextDepartureDate = convertedDate;

    }
    // Otherwise, the train arrvied in the past, so do the math
    else {

      // Next Train Departure = Frequency - (remainder of minutes from last departure)
      trainMinutesAway = trainFreq - (minuteDiffFirstArrivalToNow % trainFreq);

      // Next Departure Time = Current Time + Minutes Away
      var trainNextDepartureDate = moment().add(trainMinutesAway, 'minutes');
    }

    // Re-Format Time to AM/PM
    trainNextDeparture = trainNextDepartureDate.format("HH:mm A");

    // Create a new Object for the train
    // Easier to parse through when creating the HTML Table 
    var newObject = {
      name: trainName,
      destination: trainDestination,
      freq: trainFreq,
      nextDeparture: trainNextDeparture,
      minAway: trainMinutesAway
    };

    // Push the new Object to objects array
    arrayOfObjects.push(newObject);

    // Push the time left to times array
    arrayOfTimes.push(trainMinutesAway);

  });

  // Sort time array from smallest to largest
  arrayOfTimes.sort(function (a, b) { return a - b });

  // Remove any duplicates from array
  $.unique(arrayOfTimes)

  // Loop through all the time values and append the values to the HTML Table in order of departure time
  for (var i = 0; i < arrayOfTimes.length; i++) {

    // First Loop checks through all the times, second loop checks if any of the objects match that time
    for (var j = 0; j < arrayOfObjects.length; j++) {

      // The object's minutes to departue equals the next lowest value
      if (arrayOfObjects[j].minAway == arrayOfTimes[i]) {

        // Appends the object's elements to the HTML table
        // Appends new HTML table row 
        var newRow = $('<tr>');
        newRow.addClass("table-body-row");

        // Creates new data cell
        var trainNameTd = $('<td>');
        var destinationTd = $('<td>');
        var frequencyTd = $('<td>');
        var nextDepartureTd = $('<td>');
        var minutesAwayTd = $('<td>');

        // Adds text to the cell in HTML
        trainNameTd.text(arrayOfObjects[j].name);
        destinationTd.text(arrayOfObjects[j].destination);
        frequencyTd.text(arrayOfObjects[j].freq);
        nextDepartureTd.text(arrayOfObjects[j].nextDeparture);
        minutesAwayTd.text(arrayOfObjects[j].minAway);

        // Appends HTML data cells to the new row
        newRow.append(trainNameTd);
        newRow.append(destinationTd);
        newRow.append(frequencyTd);
        newRow.append(nextDepartureTd);
        newRow.append(minutesAwayTd);

        // Appends new row to HTML table
        $('.table').append(newRow);

      }
    }
  }
}

// Update the Current Time every second
var timeStep = setInterval(currentTime, 1000);

function currentTime() {
  var timeNow = moment().format("HH:mm:ss A");
  $("#current-time").text(timeNow);

  // Refreshes the Page every minute
  var secondsNow = moment().format("ss");

  if (secondsNow == "00") {
    refreshTable();
  }

}