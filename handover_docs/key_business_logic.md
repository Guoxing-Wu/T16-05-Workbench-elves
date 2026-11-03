# Key Business Logic

## Chapter Planning and Story Structure Mapping

- The projected chapter count is calculated from the target word count and average chapter length:

  ```text
  projected chapters = max(1, round(target word count / average chapter length))
  ```

​	If either input is zero or negative, the calculation returns zero. For example, setting the target word 	count to 60,000 and the average chapter length to 3,000 produces 20 projected chapters.

- Acts are mapped to consecutive chapter ranges according to their percentage boundaries. Each act receives at least one chapter when enough chapters are available. If there are fewer chapters than acts, no act ranges are assigned.

- Story beats can represent either a single point or a percentage range. For a 20-chapter plan, a point beat at 25% maps to Chapter 5, while a beat covering 25–50% maps to Chapters 6–10.



## Character Age Calculation

- Character age is calculated relative to a story date. The calculation starts with the difference between the reference year and birth year. It subtracts one when the available month and day information shows that the birthday has not yet occurred.
- Month and day comparisons are only performed when the corresponding information exists in both dates. A year-only birthday therefore provides less precise age information than a complete birthday.



## Excel Workbook Generation

- Excel export uses ExcelJS to generate a workbook containing a STRUCTURE worksheet. The project must contain at least one chapter.

- The exporter sorts the actual chapters by their order and uses the shared act and story-beat mapping functions to arrange the worksheet.

- The workbook includes chapter titles, word goals, cumulative word-goal and manuscript-percentage formulas, chapter notes, acts, and story beats. The POV column is left blank for the author to complete in Excel.

- Character appearances combine direct chapter links with characters linked through events and scenes. Only characters appearing in at least one chapter receive worksheet columns.

- If multiple range beats cover the same chapter, the latest-starting beat is selected for the range beat column.

- The workbook is generated in the browser and downloaded as an `.xlsx` file. Excel export is one-way; changes made in the workbook are not imported back into the application.