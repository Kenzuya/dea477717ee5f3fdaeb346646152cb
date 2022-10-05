const Driverays = require('./driverays');

/**
 *
 * @param {string} query
 */
async function DriveraysSearch(query) {
    const search_query = query.split(' ').join('+');
    const url = `https://167.86.71.48/?s=${search_query}&post_type=post`;
    const results = await Driverays(url);
    // console.log(results);
    return results;
}
// DriveraysSearch('home alone');
module.exports = DriveraysSearch;
