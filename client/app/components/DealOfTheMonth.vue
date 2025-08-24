<template>
  <div class="">
    <div class="" v-if="pending">Loading...</div>
    <div v-if="!pending && deals" class="flex gap-6 ml-[170px] items-center">
      <div class="flex-1">
        <div class="mb-5">
          <h2 class="mb-2 text-3xl font-semibold text-gray-800">
            Deals of the month
          </h2>
          <p class="mb-2">
            {{ deals.description }}
          </p>
          <u-button
            size="xl"
            to="/collections"
            class="px-6 rounded-md shadow-2xl shadow-black/50 uppercase !bg-black"
            >Buy now</u-button
          >
        </div>

        <div>
          <p class="text-2xl capitalize">
            <b>Hurry, before it is too late!</b>
          </p>

          <ClientOnly>
            <div class="flex items-center gap-4">
              <div class="flex flex-col items-center">
                <u-button
                  color="neutral"
                  variant="outline"
                  size="lg"
                  class="w-[80px] h-[80px] text-2xl font-orbitron rounded-md shadow-lg !bg-transparent justify-center"
                  >{{ timeLeft.days }}</u-button
                >
                <p>Days</p>
              </div>

              <div class="flex flex-col items-center">
                <u-button
                  color="neutral"
                  variant="outline"
                  size="lg"
                  class="w-[80px] h-[80px] text-2xl font-orbitron rounded-md shadow-lg !bg-transparent justify-center"
                  >{{ timeLeft.hours }}</u-button
                >
                <p>Hrs</p>
              </div>

              <div class="flex flex-col items-center">
                <u-button
                  color="neutral"
                  variant="outline"
                  size="lg"
                  class="w-[80px] h-[80px] text-2xl font-orbitron rounded-md shadow-lg !bg-transparent justify-center"
                  >{{ timeLeft.minutes }}</u-button
                >
                <p>Mins</p>
              </div>

              <div class="flex flex-col items-center">
                <u-button
                  color="neutral"
                  variant="outline"
                  size="lg"
                  class="w-[80px] h-[80px] text-2xl font-orbitron rounded-md shadow-lg !bg-transparent justify-center"
                  >{{ timeLeft.seconds }}</u-button
                >
                <p>Secs</p>
              </div>
            </div>
          </ClientOnly>
        </div>
      </div>
      <div class="flex-2">
        <UCarousel
          v-slot="{ item }"
          loop
          :autoplay="{ delay: 2000 }"
          :items="deals.products"
          :ui="{ item: 'basis-1/3' }"
        >
          <img
            :src="item.images[0].url"
            width="600"
            height="600"
            class="rounded-lg object-cover"
          />
        </UCarousel>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  deals: Object,
  pending: Boolean,
  error: [String, Object, null],
});

const { deals, pending, error } = toRefs(props);

const countDown = computed(() => {
  const countDown = new Date(deals.value.endDate);
  return Math.floor((countDown.getTime() - Date.now()) / 1000);
});

const { remaining, start, pause } = useCountdown(countDown, {});

//watch if the deals value enddata has changed
watch(
  () => deals.value?.endDate,
  newValue => {
    console.log('Endate changed');
    if (newValue) {
      const countDown = new Date(newValue);
      const totalSecondsToCountdown = Math.floor(
        (countDown.getTime() - Date.now()) / 1000
      );

      pause();
      start(totalSecondsToCountdown);
    }
  }
);

const timeLeft = computed(() => {
  const days = Math.floor(remaining.value / 86400);
  const hours = Math.floor((remaining.value % 86400) / 3600);
  const minutes = Math.floor((remaining.value % 3600) / 60);
  const seconds = Math.floor(remaining.value % 60);

  return {
    days: days.toString().padStart(2, 0),
    hours: hours.toString().padStart(2, 0),
    minutes: minutes.toString().padStart(2, 0),
    seconds: seconds.toString().padStart(2, 0),
  };
});

start();
</script>

<style lang="scss" scoped></style>
