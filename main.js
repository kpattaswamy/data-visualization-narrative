function showSlide(idx) {
    document.querySelectorAll('.slide').forEach((d, i) =>
      d.classList.remove('active')
    );
    const intro = document.getElementById('intro');
    if (idx === -1) {
      intro.style.display = 'block';
    } else {
      intro.style.display = 'none';
      document.querySelectorAll('.slide')[idx].classList.add('active');
    }
  }
  
d3.csv('netflix_titles.csv').then(raw => {
    const data = raw.map(d => ({
        ...d,
        title: d.title,
        release_year: +d.release_year,
        date_added: d.date_added ? new Date(d.date_added) : null,
        year_added: d.date_added ? new Date(d.date_added).getFullYear() : null,
        country: d.country ? d.country.split(',').map(s => s.trim()) : [],
        listed_in: d.listed_in ? d.listed_in.split(',').map(s => s.trim()) : []
    }));
    showContentByYear(data);
    showNewCountriesByYear(data);
    showGenreGrowth(data);
});
  
function setupChart(svgId) {
    const svg = d3.select(svgId);
    svg.selectAll('*').remove();
    const margin = { top: 30, right: 20, bottom: 40, left: 60 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    return { svg, g, margin, width, height };
}
  
function showContentByYear(data) {
    const { g, width, height } = setupChart('#slide1 svg');
    const dataByYear = d3.rollups(
        data.filter(d => d.year_added),
        v => v.length,
        d => d.year_added
    ).sort((a, b) => a[0] - b[0]);
    const years = dataByYear.map(d => d[0]);
    const counts = dataByYear.map(d => d[1]);
    const x = d3.scaleBand().domain(years).range([0, width]).padding(0.15);
    const y = d3.scaleLinear().domain([0, d3.max(counts)]).nice().range([height, 0]);

    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickValues(years.filter((_, i) => i % 2 === 0)));

    g.append("g").call(d3.axisLeft(y));

    g.selectAll(".bar")
        .data(dataByYear)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d[0]))
        .attr("y", d => y(d[1]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d[1]))
        .attr("fill", "#b81d24")
        .on("click", (event, d) => {
        const year = d[0];
        const titles = data.filter(x => x.year_added === year).map(x => x.title);
        document.getElementById("detail1").innerHTML =
            `<strong>Titles added in ${year} (${titles.length}):</strong><br>` +
            titles.slice(0, 100).join("<br>");
        });

    g.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .text("Netflix Titles Added Per Year");
}
  
function showNewCountriesByYear(data) {
    const { g, width, height } = setupChart('#slide2 svg');

    const countryFirstYear = {};
    data.forEach(row => {
        if (!row.year_added) return;
        row.country.forEach(c => {
        if (c && (!countryFirstYear[c] || row.year_added < countryFirstYear[c])) {
            countryFirstYear[c] = row.year_added;
        }
        });
    });
    const yearlyNewCountries = d3.rollups(
        Object.entries(countryFirstYear),
        v => v.length,
        ([, year]) => year
    ).sort((a, b) => a[0] - b[0]);
    const years = yearlyNewCountries.map(d => d[0]);
    const counts = yearlyNewCountries.map(d => d[1]);
    const x = d3.scaleBand().domain(years).range([0, width]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(counts)]).nice().range([height, 0]);

    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickValues(years.filter((_, i) => i % 2 === 0)));

    g.append("g").call(d3.axisLeft(y));

    g.selectAll(".bar")
        .data(yearlyNewCountries)
        .join("rect")
        .attr("x", d => x(d[0]))
        .attr("y", d => y(d[1]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d[1]))
        .attr("fill", "#b81d24")
        .on("click", (event, d) => {
        const year = d[0];
        const countries = Object.entries(countryFirstYear)
            .filter(([_, y]) => y === year)
            .map(([country]) => country);
        document.getElementById("detail2").innerHTML =
            `<strong>New countries in ${year} (${countries.length}):</strong><br>` +
            countries.join("<br>");
        });

    g.append("text")
        .attr("x", width / 2)
        .attr("y", -12)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .text("New Countries Adding Netflix Content Per Year");
}
  
function showGenreGrowth(data) {
    const { g, width, height } = setupChart('#slide3 svg');
  
    const genresByYear = {};
    data.forEach(d => {
      if (!d.year_added) return;
      if (!genresByYear[d.year_added]) genresByYear[d.year_added] = new Set();
      d.listed_in.forEach(g => genresByYear[d.year_added].add(g));
    });
  
    const genreGrowth = Object.entries(genresByYear)
      .map(([year, set]) => [parseInt(year), set.size])
      .sort((a, b) => a[0] - b[0]);
    const years = genreGrowth.map(d => d[0]);
    const counts = genreGrowth.map(d => d[1]);
    const x = d3.scaleBand().domain(years).range([0, width]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(counts)]).nice().range([height, 0]);
  
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickValues(years.filter((_, i) => i % 2 === 0)));
  
    g.append("g").call(d3.axisLeft(y));
  
    g.selectAll(".bar")
      .data(genreGrowth)
      .join("rect")
      .attr("x", d => x(d[0]))
      .attr("y", d => y(d[1]))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d[1]))
      .attr("fill", "#b81d24")
      .on("click", (event, d) => {
        const year = d[0];
        const genres = new Set();
        data.filter(x => x.year_added === year).forEach(row =>
          row.listed_in.forEach(g => genres.add(g))
        );
        document.getElementById("detail3").innerHTML =
          `<strong>Genres added in ${year} (${genres.size}):</strong><br>` +
          Array.from(genres).join("<br>");
      });
  
    g.append("text")
      .attr("x", width / 2)
      .attr("y", -12)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .text("Growth in Number of Genres by Year");
}
  