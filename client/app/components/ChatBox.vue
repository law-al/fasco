<template>
  <UPopover
    v-model:open="open"
    :content="{
      align: 'end',
      side: 'top',
      sideOffset: 2,
    }"
  >
    <UButton
      color="neutral"
      variant="subtle"
      class="!bg-white ring-0 !shadow-lg"
    >
      <img src="/images/chat.png" alt="Chat" class="w-10"
    /></UButton>

    <template #content>
      <div
        class="border-2 border-gray-200 w-[350px] h-[400px] bg-white rounded-md p-2 flex flex-col gap-2 font-primary"
      >
        <!-- main box -->
        <div class="flex-6">
          <div
            v-if="messages.length === 0"
            class="w-full h-full flex flex-col gap-2 items-center justify-center border border-gray-200 rounded-md"
          >
            <p class="text-gray-700">Chat with AI</p>
            <img src="/images/bubble-chat.png" alt="Bubble Chat" class="w-15" />
          </div>

          <div
            v-else
            class="py-5 px-2 h-[320px] overflow-y-scroll flex flex-col gap-2 border border-gray-200 rounded-md"
          >
            <!-- Regular Messages -->
            <div
              v-for="(message, index) in messages"
              :key="index"
              class="flex items-start gap-2"
            >
              <!-- Bot/AI Icon -->
              <UAvatar
                v-if="message.isAi"
                src="/images/bot-avatar.png"
                size="sm"
                class="mt-1"
              />

              <!-- Message Bubble -->
              <div
                :class="[
                  'p-2 rounded-md max-w-[80%] text-sm',
                  message.isAi
                    ? 'bg-gray-200 self-start'
                    : 'bg-indigo-500 text-white self-end ml-auto',
                ]"
              >
                <p v-if="!message.isAi">{{ message.text }}</p>
                <p v-else>
                  <span v-html="message.text"></span>
                </p>
              </div>

              <!-- User Icon -->
              <UAvatar
                v-if="!message.isAi"
                src="/images/user-avatar.png"
                size="sm"
                class="mt-1"
              />
            </div>

            <!-- AI Typing Indicator -->
            <div v-if="isTyping" class="flex items-start gap-2">
              <UAvatar src="/images/bot-avatar.png" size="sm" class="mt-1" />
              <div class="bg-gray-200 p-3 rounded-md flex gap-1">
                <div
                  class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                ></div>
                <div
                  class="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"
                ></div>
                <div
                  class="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- chat form -->
        <div class="flex-1 flex items-center">
          <form action="" @submit.prevent="onSubmit" class="w-full">
            <div
              class="flex items-center gap-2 border-2 border-gray-200 rounded-md p-1 group focus-within:border-gray-200"
            >
              <input
                type="text"
                class="w-[85%] rounded-md p-2 !outline-none focus:ring-0 border-none"
                placeholder="Type a message..."
                v-model="input"
              />
              <UButton
                color="primary"
                type="submit"
                icon="i-mdi-send"
                variant="solid"
                :disabled="input.trim() === '' || isTyping"
                class="w-[40px] h-[40px] justify-center"
              />
            </div>
          </form>
        </div>
        <NuxtLink></NuxtLink>
      </div>
    </template>
  </UPopover>
</template>

<script setup>
const open = ref(false);
const messages = ref([]);
const isTyping = ref(false);
const error = ref(null);

const input = ref('');
const config = useRuntimeConfig();

async function onSubmit() {
  if (input.value.trim() === '') return;

  const userMessage = input.value.trim();
  console.log('Message sent:', userMessage);

  messages.value.push({ text: userMessage, isAi: false });

  input.value = '';

  try {
    isTyping.value = true;
    error.value = null;

    const response = await $fetch('/api/v1/chat', {
      method: 'POST',
      body: { prompt: userMessage },
      credentials: 'include',
      baseURL: config.public.apiBase,
    });

    if (response) {
      console.log('API response:', response);

      const parsedResponse =
        `${response.data?.answer || 'Hello'} ${
          response.data?.suggestion || ''
        }` || 'Hello';

      const parsedResponseWithLink = parsedResponse.replace(
        /View product:\s*(https?:\/\/[^\s]+)/g,
        (match, url) => {
          const productLink = url.split('/').slice(-2).join('/').split('.')[0];
          const productName = url.split('/').pop().replace(/-/g, ' ');

          return `<a href="/${productLink}" class="text-blue-500 underline hover:text-blue-700 capitalize">${productName}</a>`;
        }
      );
      console.log('Parsed response with link:', parsedResponseWithLink);
      messages.value.push({ text: parsedResponseWithLink, isAi: true });
    }
  } catch (error) {
    console.error('Error fetching AI response:', error);
    error.value = 'Failed to get response. Please try again.';
    messages.value.push({ text: error.value, isAi: true });
  } finally {
    isTyping.value = false;
  }
}

defineShortcuts({
  o: () => (open.value = !open.value),
});
</script>
