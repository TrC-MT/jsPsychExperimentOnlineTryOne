/**
 * @title experiment-jspsych-builder-try-one
 * @description Trying to host a jspsych expirement from a tutorial
 * @version 0.1.0
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

/*
import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import PreloadPlugin from "@jspsych/plugin-preload";
*/

// Import jsPsych, and some of its plugins
import { initJsPsych } from "jspsych";
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import imageKeyboardResponse from '@jspsych/plugin-image-keyboard-response';
import preload from '@jspsych/plugin-preload';


/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 */
export async function run({ assetPaths, input = {}, environment, title, version }) {
/* COMES FROM JSPSYCHBUILDER, NOT USING

  const jsPsych = initJsPsych();

  const timeline = [];

  // Preload assets
  timeline.push({
    type: PreloadPlugin,
    images: assetPaths.images,
    audio: assetPaths.audio,
    video: assetPaths.video,
  });

  // Welcome screen
  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus: "<p>Welcome to experiment-jspsych-builder-try-one!<p/>",
  });

  // Switch to fullscreen
  timeline.push({
    type: FullscreenPlugin,
    fullscreen_mode: true,
  });

*/

  // Initialize jsPsych
const jsPsych = initJsPsych({
  on_finish: function() {
    jsPsych.data.displayData('json'); // Documentation: https://www.jspsych.org/7.3/reference/jspsych-data/#jspsychdatadisplaydata
    jsPsych.data.get().localSave('json', 'experiment-data.json');
  }
});

// Set up the flow for the display
var timeline = [];

// Initialize the variable for the preloading files count
var file_load_count = 0;
var file_error_count = 0;

// Preload media
var preload_trial = {
  type: preload,
  auto_preload: true,
  images: ['assets/img/blue.png', 'assets/img/orange.png'], // Manually preload the two images just in case
  show_progress_bar: false, // hide preloading progress bar
  message: 'Please wait while the experiment loads.',
  max_load_time: 60000, // Allow one minute to preload
  error_message: 'The experiment failed to load. Please try again.',
  show_detailed_errors: true, // Show details of any file loading errors and/or loading time out
  continue_after_error: false, // If the preloading doesn't work, end the expirement
  /*
    "The preload plugin's on_success and on_error callback functions provide another way of tracking preloading progress and handling file loading errors. These functions are called after any file either loads successfully or produces an error, respectively. These functions receive a single argument, which is the path of the file (string) that loaded or produced an error.
    Note that there's no guarantee that any/all files will trigger one of these two callback functions, because they are cancelled after the preload trial ends. For instance, if a file takes longer to load then the max_load_time, then the preload trial will end due to timing out, and the on_success and on_error callbacks for any in-progress files will be cancelled."
  */
    on_error: function(file) {
      file_error_count++;
      console.log('Error: ',file);
    },
    on_success: function(file) {
        file_load_count++;
        console.log('Loaded: ',file);
    }
};

// Add the preload to the flow
timeline.push(preload_trial);

// Create the welcome display
var welcome = {
    type: htmlKeyboardResponse,
    stimulus: "Welcome to the experiment. Press any key to begin."
  };

// Add the welcome display to the flow
timeline.push(welcome);

// Create the instructions display
var instructions = {
    type: htmlKeyboardResponse,
    stimulus: `
      <p>In this experiment, a circle will appear in the center of the screen.</p>
      <p>If the circle is <strong>blue</strong>, press the letter F on the keyboard as fast as you can.</p>
      <p>If the circle is <strong>orange</strong>, press the letter J as fast as you can.</p>
      <div style='width: 700px;'>
        <div style='float: left;'>
            <img src='assets/img/blue.png'></img>
            <p class='small'><strong>Press the F key</strong></p>
        </div>
        <div style='float: right;'>
            <img src='assets/img/orange.png'></img>
            <p class='small'><strong>Press the J key</strong></p>
        </div>
      </div>
      <p>Press any key to begin.</p>
    `,
    post_trial_gap: 2000 // Two thousand miliseconds (two seconds)
  };

// Add the instructions display to the flow
timeline.push(instructions);

/*
// Redundant
var blue_trial = {
    type: imageKeyboardResponse,
    stimulus: 'img/blue.png',
    choices: ['f', 'j'] //Only allow the 'f', and 'j' keys to be valid responses
  };
  
  var orange_trial = {
    type: imageKeyboardResponse,
    stimulus: 'img/orange.png',
    choices: ['f', 'j']
  };
  
//Add the blue_trial and the orange_trial to the flow.
timeline.push(blue_trial, orange_trial);

*/
var test_stimuli = [
  { stimulus: "assets/img/blue.png", correct_response: 'f'},
  { stimulus: "assets/img/orange.png", correct_response: 'j'}
];

var fixation = {
  type: htmlKeyboardResponse,
  stimulus: '<div style="font-size:60px;">+</div>',
  choices: "NO_KEYS", // "No responses will be accepted as a valid response and the trial will last however long the trial_duration parameter specifies."
  trial_duration: function(){
    return jsPsych.randomization.sampleWithoutReplacement([250, 500, 750, 1000, 1250, 1500, 1750, 2000], 1)[0]; // Documentation: https://www.jspsych.org/7.3/reference/jspsych-randomization/
  },
  data: {
    task: 'fixation'
  }
};

var test = {
  type: imageKeyboardResponse,
  stimulus: jsPsych.timelineVariable('stimulus'),
  choices: ['f', 'j'],
  data: { // Tagging each of these trials as a 'response' trial.
    task: 'response',
    correct_response: jsPsych.timelineVariable('correct_response')
  },
  on_finish: function(data){
    data.correct = jsPsych.pluginAPI.compareKeys(data.response, data.correct_response); // Documentation: https://www.jspsych.org/7.3/reference/jspsych-pluginAPI/#comparekeys
  }
};

var test_procedure = {
  timeline: [fixation, test], // The timeline for test_procedure, will be pushed into the main timeline. Pushes in fixation and test.
  timeline_variables: test_stimuli,
  randomize_order: true, // Randomizes the order of the trials
  repetitions: 5 // Repeat 5 times
};

timeline.push(test_procedure);

// https://www.jspsych.org/7.3/tutorials/rt-task/#part-13-data-aggregation
var debrief_block = {
  type: htmlKeyboardResponse,
  stimulus: function() {

    var trials = jsPsych.data.get().filter({task: 'response'});
    var correct_trials = trials.filter({correct: true});
    var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
    var rt = Math.round(correct_trials.select('rt').mean());

    return `<p>You responded correctly on ${accuracy}% of the trials.</p>
      <p>Your average response time was ${rt}ms.</p>
      <p>Press any key to complete the experiment. Thank you!</p>`;

  }
};
timeline.push(debrief_block);

  await jsPsych.run(timeline);

  // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
  // if you handle results yourself, be it here or in `on_finish()`)
  return jsPsych;
}
