// Backend tests assert Europe/Madrid wall-clock times (the production API runs with TZ=Europe/Madrid).
// Pin the zone so results do not depend on the machine running them (CI runners are UTC).
process.env.TZ = 'Europe/Madrid';
