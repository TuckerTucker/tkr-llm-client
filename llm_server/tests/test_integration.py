"""
Integration tests for Local LLM Server

Tests the complete generation flow with a running server.
Requires the server to be running on localhost:42002.
"""

import pytest
import httpx
import asyncio
import json
from typing import List, Dict, Any


# Mark all tests as integration tests
pytestmark = pytest.mark.integration


@pytest.fixture
def base_url():
    """Base URL for test server"""
    return "http://localhost:42002"


@pytest.fixture
async def client(base_url):
    """Create async HTTP client"""
    async with httpx.AsyncClient(base_url=base_url, timeout=30.0) as client:
        yield client


class TestServerStartup:
    """Test server startup and health"""

    @pytest.mark.asyncio
    async def test_server_is_running(self, client):
        """Test server responds to health check"""
        try:
            response = await client.get("/health")
            assert response.status_code == 200
        except httpx.ConnectError:
            pytest.skip("Server not running. Start with: ./start-ace or python llm-server/server.py")

    @pytest.mark.asyncio
    async def test_health_check_response(self, client):
        """Test health check returns correct schema"""
        response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()

        assert "status" in data
        assert "model_loaded" in data
        assert data["status"] in ["ok", "starting", "error"]

    @pytest.mark.asyncio
    async def test_model_loaded(self, client):
        """Test model is loaded and ready"""
        response = await client.get("/health")
        data = response.json()

        # If server is healthy, model should be loaded
        if data["status"] == "ok":
            assert data["model_loaded"] is True


class TestChatCompletions:
    """Test chat completions functionality"""

    @pytest.mark.asyncio
    async def test_simple_completion(self, client):
        """Test simple chat completion"""
        response = await client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-oss-20b",
                "messages": [{"role": "user", "content": "What is 2+2?"}],
                "max_tokens": 50,
            },
        )

        assert response.status_code == 200
        data = response.json()

        # Validate OpenAI schema
        assert "id" in data
        assert "object" in data
        assert "choices" in data
        assert len(data["choices"]) > 0

        # Check response content
        message = data["choices"][0]["message"]
        assert message["role"] == "assistant"
        assert "content" in message
        assert len(message["content"]) > 0

        # The answer should contain "4"
        assert "4" in message["content"]

    @pytest.mark.asyncio
    async def test_completion_with_system_message(self, client):
        """Test completion with system message"""
        response = await client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-oss-20b",
                "messages": [
                    {"role": "system", "content": "You are a helpful math tutor."},
                    {"role": "user", "content": "What is 5 + 3?"},
                ],
                "max_tokens": 50,
            },
        )

        assert response.status_code == 200
        data = response.json()
        message = data["choices"][0]["message"]["content"]

        # Should contain the answer
        assert "8" in message

    @pytest.mark.asyncio
    async def test_multi_turn_conversation(self, client):
        """Test multi-turn conversation"""
        response = await client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-oss-20b",
                "messages": [
                    {"role": "user", "content": "Hello"},
                    {"role": "assistant", "content": "Hi! How can I help?"},
                    {"role": "user", "content": "Tell me a fun fact"},
                ],
                "max_tokens": 100,
            },
        )

        assert response.status_code == 200
        data = response.json()

        message = data["choices"][0]["message"]["content"]
        assert len(message) > 0

    @pytest.mark.asyncio
    async def test_completion_with_parameters(self, client):
        """Test completion with generation parameters"""
        response = await client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-oss-20b",
                "messages": [{"role": "user", "content": "Write a haiku"}],
                "max_tokens": 100,
                "temperature": 0.8,
                "top_p": 0.95,
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert data["choices"][0]["message"]["content"]


class TestStreaming:
    """Test streaming responses"""

    @pytest.mark.asyncio
    async def test_streaming_completion(self, client):
        """Test streaming chat completion"""
        async with client.stream(
            "POST",
            "/v1/chat/completions",
            json={
                "model": "gpt-oss-20b",
                "messages": [{"role": "user", "content": "Count to 5"}],
                "stream": True,
                "max_tokens": 50,
            },
        ) as response:
            assert response.status_code == 200
            assert "text/event-stream" in response.headers["content-type"]

            chunks = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]  # Remove "data: " prefix

                    if data_str == "[DONE]":
                        break

                    try:
                        chunk_data = json.loads(data_str)
                        chunks.append(chunk_data)
                    except json.JSONDecodeError:
                        pass

            # Should have received multiple chunks
            assert len(chunks) > 0

            # Check chunk structure
            for chunk in chunks:
                assert "choices" in chunk
                if chunk["choices"] and chunk["choices"][0].get("delta"):
                    delta = chunk["choices"][0]["delta"]
                    assert "content" in delta or "role" in delta

    @pytest.mark.asyncio
    async def test_streaming_accumulation(self, client):
        """Test streaming chunks accumulate correctly"""
        accumulated_text = ""

        async with client.stream(
            "POST",
            "/v1/chat/completions",
            json={
                "model": "gpt-oss-20b",
                "messages": [{"role": "user", "content": "Say 'hello world'"}],
                "stream": True,
                "max_tokens": 20,
            },
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: ") and not line.endswith("[DONE]"):
                    data_str = line[6:]
                    try:
                        chunk_data = json.loads(data_str)
                        if chunk_data["choices"]:
                            delta = chunk_data["choices"][0].get("delta", {})
                            if "content" in delta:
                                accumulated_text += delta["content"]
                    except (json.JSONDecodeError, KeyError):
                        pass

        # Accumulated text should form a complete response
        assert len(accumulated_text) > 0


class TestUsageStatistics:
    """Test usage statistics in responses"""

    @pytest.mark.asyncio
    async def test_usage_stats_present(self, client):
        """Test usage statistics are returned"""
        response = await client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-oss-20b",
                "messages": [{"role": "user", "content": "Hi"}],
                "max_tokens": 10,
            },
        )

        data = response.json()

        assert "usage" in data
        assert "prompt_tokens" in data["usage"]
        assert "completion_tokens" in data["usage"]
        assert "total_tokens" in data["usage"]

    @pytest.mark.asyncio
    async def test_usage_stats_accurate(self, client):
        """Test usage statistics are accurate"""
        response = await client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-oss-20b",
                "messages": [{"role": "user", "content": "What is your name?"}],
                "max_tokens": 50,
            },
        )

        data = response.json()
        usage = data["usage"]

        # Total should equal prompt + completion
        assert usage["total_tokens"] == usage["prompt_tokens"] + usage["completion_tokens"]

        # All counts should be positive
        assert usage["prompt_tokens"] > 0
        assert usage["completion_tokens"] > 0
        assert usage["total_tokens"] > 0


class TestModelsEndpoint:
    """Test models listing"""

    @pytest.mark.asyncio
    async def test_list_models(self, client):
        """Test models endpoint"""
        response = await client.get("/v1/models")

        assert response.status_code == 200
        data = response.json()

        assert data["object"] == "list"
        assert "data" in data
        assert len(data["data"]) > 0

    @pytest.mark.asyncio
    async def test_model_fields(self, client):
        """Test model object fields"""
        response = await client.get("/v1/models")
        data = response.json()

        model = data["data"][0]
        assert "id" in model
        assert "object" in model
        assert model["object"] == "model"


class TestErrorHandling:
    """Test error handling"""

    @pytest.mark.asyncio
    async def test_invalid_request(self, client):
        """Test invalid request handling"""
        response = await client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-oss-20b",
                # Missing messages
            },
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_empty_messages(self, client):
        """Test empty messages array"""
        response = await client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-oss-20b",
                "messages": [],
            },
        )

        # Should handle gracefully
        assert response.status_code in [200, 400, 422]


class TestPerformance:
    """Test performance characteristics"""

    @pytest.mark.asyncio
    async def test_response_time(self, client):
        """Test response time is reasonable"""
        import time

        start = time.time()
        response = await client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-oss-20b",
                "messages": [{"role": "user", "content": "Hi"}],
                "max_tokens": 10,
            },
        )
        elapsed = time.time() - start

        assert response.status_code == 200

        # Response should be reasonably fast (adjust based on your hardware)
        # First request may be slower (cold start)
        assert elapsed < 30.0  # 30 seconds max

    @pytest.mark.asyncio
    async def test_concurrent_requests(self, client):
        """Test handling of concurrent requests"""
        async def make_request():
            return await client.post(
                "/v1/chat/completions",
                json={
                    "model": "gpt-oss-20b",
                    "messages": [{"role": "user", "content": "Hi"}],
                    "max_tokens": 5,
                },
            )

        # Make 3 concurrent requests
        responses = await asyncio.gather(
            make_request(),
            make_request(),
            make_request(),
        )

        # All should succeed
        for response in responses:
            assert response.status_code == 200


class TestFullGenerationFlow:
    """Test complete generation flow"""

    @pytest.mark.asyncio
    async def test_full_generation_flow(self, client):
        """Test complete generation flow from health check to response"""
        # Step 1: Check health
        health_resp = await client.get("/health")
        assert health_resp.status_code == 200
        health_data = health_resp.json()
        assert health_data["status"] == "ok"

        # Step 2: List models
        models_resp = await client.get("/v1/models")
        assert models_resp.status_code == 200

        # Step 3: Generate completion
        completion_resp = await client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-oss-20b",
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": "What is 2+2? Answer with just the number."},
                ],
                "max_tokens": 10,
            },
        )

        assert completion_resp.status_code == 200
        completion_data = completion_resp.json()

        # Validate complete response
        assert completion_data["object"] == "chat.completion"
        assert len(completion_data["choices"]) == 1
        assert "4" in completion_data["choices"][0]["message"]["content"]
        assert completion_data["usage"]["total_tokens"] > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-m", "integration"])
