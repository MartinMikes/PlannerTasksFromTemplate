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

**Template task**:
A reusable task definition that can be included in a concert plan when its planning scope matches.
_Avoid_: Task draft, task seed

**Responsibility group**:
A named ownership role responsible for a template task and mapped to one or more assignees.
_Avoid_: Team, department

**Schedule offset**:
The relative number of days from the event date used to derive when a task should be due.
_Avoid_: Deadline, SLA

**Event date**:
The target date of the concert used as the anchor for scheduling.
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

**Processing record**:
The durable record of how one concert request progresses toward one usable concert plan, including its current outcome and recovery history.
_Avoid_: Run log, Flow instance

**Processing item**:
The durable record that relates one template-defined bucket or task to the corresponding item created in a concert plan.
_Avoid_: Cache row, temporary mapping

**Replacement plan**:
A new concert plan explicitly authorized by an operator after the preceding concert plan has been abandoned because it cannot be safely completed.
_Avoid_: Retry plan, duplicate plan
