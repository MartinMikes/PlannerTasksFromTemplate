# Campanula Concert Planning

This context defines the shared language for planning one choir concert through reusable templates and turning that plan into concrete work for organisers.

## Language

**Concert request**:
A submitted planning request for one upcoming concert.
_Avoid_: Form entry, submission row

**Concert plan**:
The complete set of buckets and tasks prepared for one specific concert instance.
_Avoid_: Project, board

**Concert type**:
The selected template variant describing the overall size and character of the concert.
_Avoid_: Mode, category, scenario

**Venue**:
The selected concert location used for venue-specific preparation and naming.
_Avoid_: Place, site

**Planning scope**:
The union of generic tasks for the selected concert type and venue-specific tasks for the selected venue.
_Avoid_: Filter, query result

**Workbook contract**:
The required tables, columns, and shared configuration that make the task-template workbook structurally usable for concert planning.
_Avoid_: Workbook layout, Excel format

**Template task**:
A reusable task definition that can be included in a concert plan when its planning scope matches.
_Avoid_: Task draft, task seed

**Template task key**:
The stable identifier of a template task used to recognize it independently of its workbook row position or title.
_Avoid_: Excel row number, task title

**Invalid template task**:
A selected template task that cannot be safely translated into a Planner task and is therefore skipped and reported.
_Avoid_: Bad row, failed task

**Responsibility group**:
A named ownership role required by every template task and mapped to one or more assignees.
_Avoid_: Team, department

**Schedule offset**:
The relative number of days from the event date used to derive when a task should be due.
_Avoid_: Deadline, SLA

**Event date**:
The future calendar date of the concert, interpreted in Europe/Prague and used as the anchor for scheduling.
_Avoid_: Due date, target date

**Bucket**:
A planning-stage grouping that organizes tasks within a concert plan.
_Avoid_: Column, lane

**Checklist item**:
A single actionable sub-step inside a task.
_Avoid_: Note, comment

**Planning label**:
A thematic classification tag used to group tasks for reporting and review.
_Avoid_: Status, priority

**Processing lifecycle**:
The progression of one concert request from receipt through concert plan completion or generation failure.
_Avoid_: Flow run, recovery process

**Concert plan completion**:
The outcome reached when every valid template task in the selected planning scope has been created for a concert request, independently of notification delivery.
_Avoid_: Notification success, Flow success

**Completed with warnings**:
A terminal processing outcome in which concert plan completion was reached but one or more invalid template tasks were skipped and reported.
_Avoid_: Partial failure, awaiting operator

**Generation failure**:
A runtime or integration failure that prevents valid Planner content from being created and requires any partial concert plan to be deleted before a new concert request is submitted.
_Avoid_: Template warning, invalid task

**Operator**:
An authorized person who responds to generation failures by deleting a partial concert plan, correcting the cause, and submitting a new concert request.
_Avoid_: Administrator, task owner
