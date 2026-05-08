function shuffle(arr) {
  // Start with the last index
  let currIdx = arr.length;

  while (currIdx > 0) {
    // Swap the last index with a random index
    let randomIdx = Math.floor(Math.random() * currIdx);
    currIdx--;
    [arr[currIdx], arr[randomIdx]] = [arr[randomIdx], arr[currIdx]];
  }
}

export default { shuffle };